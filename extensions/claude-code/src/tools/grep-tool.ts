import path from "node:path";
import { Type } from "@sinclair/typebox";
import { readStringParam } from "openclaw/plugin-sdk/param-readers";
import { buildTool } from "../build-tool.js";
import type { ClaudeCodeConfig } from "../config.js";
import { textResult } from "../tool-result.js";

const GrepToolParameters = Type.Object(
  {
    pattern: Type.String({
      description: "Regular expression or text pattern to search for",
    }),
    path: Type.Optional(Type.String({ description: "File or directory path to search in" })),
    caseSensitive: Type.Optional(
      Type.Boolean({ description: "Whether the search is case sensitive (default: false)" }),
    ),
    context: Type.Optional(
      Type.Integer({
        description: "Number of lines of context to show around matches",
        minimum: 0,
        maximum: 10,
      }),
    ),
    include: Type.Optional(Type.String({ description: "File pattern filter (e.g., *.ts, *.js)" })),
  },
  { additionalProperties: false },
);

export function createGrepTool(config: ClaudeCodeConfig) {
  return buildTool({
    name: "grep",
    description:
      "Search for patterns in files. Use for finding code, text, or specific definitions.",
    parameters: GrepToolParameters,
    isReadOnly: true,
    isConcurrencySafe: true,
    isDestructive: false,

    getActivityDescription(input) {
      const p = input?.pattern;
      return typeof p === "string" ? `Searching for "${p}"` : null;
    },

    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      try {
        const pattern = readStringParam(rawParams, "pattern", { required: true });
        if (!pattern) {
          return textResult("pattern is required");
        }

        const searchPath = (rawParams.path as string) || process.cwd();
        const caseSensitive = (rawParams.caseSensitive as boolean) ?? false;
        const contextLines = (rawParams.context as number) || 0;
        const includePattern = rawParams.include as string | undefined;

        const resolvedPath = path.resolve(searchPath);
        const results = await grepSearch(pattern, {
          path: resolvedPath,
          caseSensitive,
          contextLines,
          includePattern,
        });

        if (results.length === 0) {
          return textResult("No matches found.");
        }
        return textResult(results.join("\n"));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return textResult(`Grep error: ${message}`);
      }
    },
  });
}

interface GrepOptions {
  path: string;
  caseSensitive?: boolean;
  contextLines?: number;
  includePattern?: string;
}

async function grepSearch(pattern: string, options: GrepOptions): Promise<string[]> {
  const { path: searchPath, caseSensitive = false, contextLines = 0, includePattern } = options;
  const fs = await import("node:fs/promises");
  const results: string[] = [];

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, caseSensitive ? "g" : "gi");
  } catch {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    regex = new RegExp(escaped, caseSensitive ? "g" : "gi");
  }

  async function searchInFile(filePath: string): Promise<void> {
    let content: string;
    try {
      content = await fs.readFile(filePath, "utf-8");
    } catch {
      return;
    }

    const lines = content.split("\n");
    const matches: { lineNo: number; line: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        matches.push({ lineNo: i + 1, line: lines[i] });
        regex.lastIndex = 0;
      }
    }

    if (matches.length > 0) {
      const relativePath = path.relative(process.cwd(), filePath);
      for (const match of matches) {
        let resultLine = `${relativePath}:${match.lineNo}: ${match.line}`;
        if (contextLines > 0) {
          const startCtx = Math.max(0, match.lineNo - contextLines - 1);
          const endCtx = Math.min(lines.length, match.lineNo + contextLines);
          for (let j = startCtx; j < endCtx; j++) {
            if (j + 1 !== match.lineNo) {
              resultLine += `\n  ${j + 1}: ${lines[j]}`;
            }
          }
        }
        results.push(resultLine);
      }
    }
  }

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
          await walk(fullPath);
        }
      } else if (entry.isFile()) {
        if (includePattern) {
          const globRegex = patternToGlob(includePattern);
          if (!globRegex.test(entry.name)) {
            continue;
          }
        }
        await searchInFile(fullPath);
      }
    }
  }

  const stat = await fs.stat(searchPath);
  if (stat.isFile()) {
    await searchInFile(searchPath);
  } else {
    await walk(searchPath);
  }

  return results.slice(0, 1000);
}

function patternToGlob(pattern: string): RegExp {
  return new RegExp(pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, "."));
}
