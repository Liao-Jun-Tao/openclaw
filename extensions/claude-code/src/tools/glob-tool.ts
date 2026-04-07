import path from "node:path";
import { Type } from "@sinclair/typebox";
import { readStringParam } from "openclaw/plugin-sdk/param-readers";
import { buildTool } from "../build-tool.js";
import type { ClaudeCodeConfig } from "../config.js";
import { textResult } from "../tool-result.js";

const GlobToolParameters = Type.Object(
  {
    pattern: Type.String({
      description: "Glob pattern to match files (e.g., **/*.ts, src/**/*.js)",
    }),
    baseDirectory: Type.Optional(
      Type.String({
        description: "Base directory to search from (defaults to current directory)",
      }),
    ),
  },
  { additionalProperties: false },
);

export function createGlobTool(config: ClaudeCodeConfig) {
  return buildTool({
    name: "glob",
    description:
      "Find files by matching glob patterns. Use for discovering files by name patterns.",
    parameters: GlobToolParameters,
    isReadOnly: true,
    isConcurrencySafe: true,
    isDestructive: false,

    getActivityDescription(input) {
      const p = input?.pattern;
      return typeof p === "string" ? `Searching for ${p}` : null;
    },

    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      try {
        const pattern = readStringParam(rawParams, "pattern", { required: true });
        if (!pattern) {
          return textResult("pattern is required");
        }

        const baseDir = (rawParams.baseDirectory as string) || process.cwd();
        const resolvedBase = path.resolve(baseDir);
        const matches = await globMatch(pattern, resolvedBase);

        if (matches.length === 0) {
          return textResult("No files matched the pattern.");
        }
        return textResult(matches.join("\n"));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return textResult(`Glob error: ${message}`);
      }
    },
  });
}

async function globMatch(pattern: string, baseDir: string): Promise<string[]> {
  const fs = await import("node:fs/promises");
  const results: string[] = [];

  const regexPattern = pattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, "{{DOUBLE_STAR}}")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]")
    .replace(/\{\{DOUBLE_STAR\}\}/g, ".*");

  const regex = new RegExp(`^${regexPattern}$`);

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

      if (entry.isFile() && (regex.test(relativePath) || regex.test(fullPath))) {
        results.push(relativePath);
      }

      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        await walk(fullPath);
      }
    }
  }

  await walk(baseDir);
  return results.toSorted();
}
