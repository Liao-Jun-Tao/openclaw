import path from "node:path";
import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";
import { Type } from "@sinclair/typebox";
import type { ToolUseContext } from "openclaw/plugin-sdk/channel-contract.js";
import { readStringParam } from "openclaw/plugin-sdk/param-readers.js";
import { resolveClaudeCodeConfig, type ClaudeCodeConfig } from "../config.js";

const GREP_TOOL_NAME = "grep";
const GREP_TOOL_DESCRIPTION =
  "Search for patterns in files. Use for finding code, text, or specific function/class definitions.";

const GrepInputSchema = Type.Object({
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
});

type GrepInput = Type.Input<typeof GrepInputSchema>;

export function createGrepTool(params: {
  context: ToolUseContext;
  config: ClaudeCodeConfig;
}): AgentTool {
  const { config } = params;

  return {
    name: GREP_TOOL_NAME,
    description: GREP_TOOL_DESCRIPTION,
    inputSchema: GrepInputSchema,

    async handle(params: Record<string, unknown>): Promise<AgentToolResult> {
      const startTime = Date.now();

      try {
        const pattern = readStringParam(params, "pattern", { required: true });
        if (!pattern) {
          return {
            ok: false,
            status: "failed",
            result: { type: "text", text: "pattern is required" },
          };
        }

        const searchPath = (params.path as string) || process.cwd();
        const caseSensitive = (params.caseSensitive as boolean) ?? false;
        const contextLines = (params.context as number) || 0;
        const includePattern = params.include as string | undefined;

        const resolvedPath = path.resolve(searchPath);

        const results = await grepSearch(pattern, {
          path: resolvedPath,
          caseSensitive,
          contextLines,
          includePattern,
        });

        const durationMs = Date.now() - startTime;

        if (results.length === 0) {
          return {
            ok: true,
            status: "completed",
            result: { type: "text", text: "No matches found." },
            metadata: { durationMs },
          };
        }

        return {
          ok: true,
          status: "completed",
          result: {
            type: "text",
            text: results.join("\n"),
          },
          metadata: {
            durationMs,
            matchCount: results.length,
          },
        };
      } catch (error) {
        const durationMs = Date.now() - startTime;
        const message = error instanceof Error ? error.message : String(error);

        return {
          ok: false,
          status: "failed",
          result: { type: "text", text: `Grep error: ${message}` },
          metadata: { durationMs },
        };
      }
    },
  };
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

  // Compile regex
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, caseSensitive ? "g" : "gi");
  } catch {
    // If invalid regex, treat as literal string
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
        regex.lastIndex = 0; // Reset for next test
      }
    }

    if (matches.length > 0) {
      const relativePath = path.relative(process.cwd(), filePath);

      for (const match of matches) {
        let resultLine = `${relativePath}:${match.lineNo}: ${match.line}`;

        // Add context lines
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
        if (!entry.name.startsWith(".")) {
          await walk(fullPath);
        }
      } else if (entry.isFile()) {
        // Check include pattern
        if (includePattern) {
          const globMatch = patternToGlob(includePattern);
          if (!globMatch.test(entry.name)) {
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

  return results.slice(0, 1000); // Limit results
}

function patternToGlob(pattern: string): RegExp {
  return new RegExp(pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, "."));
}

// Tool definition for registration
export const grepToolDefinition = {
  name: GREP_TOOL_NAME,
  description: GREP_TOOL_DESCRIPTION,
  inputSchema: GrepInputSchema,
};
