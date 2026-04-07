import path from "node:path";
import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";
import { Type } from "@sinclair/typebox";
import type { ToolUseContext } from "openclaw/plugin-sdk/channel-contract.js";
import { readStringParam } from "openclaw/plugin-sdk/param-readers.js";
import { resolveClaudeCodeConfig, type ClaudeCodeConfig } from "../config.js";

const GLOB_TOOL_NAME = "glob";
const GLOB_TOOL_DESCRIPTION =
  "Find files by matching glob patterns. Use for discovering files by name patterns like **/*.ts or src/**/*.js.";

const GlobInputSchema = Type.Object({
  pattern: Type.String({
    description: "Glob pattern to match files (e.g., **/*.ts, src/**/*.js)",
  }),
  baseDirectory: Type.Optional(
    Type.String({ description: "Base directory to search from (defaults to current directory)" }),
  ),
});

type GlobInput = Type.Input<typeof GlobInputSchema>;

export function createGlobTool(params: {
  context: ToolUseContext;
  config: ClaudeCodeConfig;
}): AgentTool {
  const { config } = params;

  return {
    name: GLOB_TOOL_NAME,
    description: GLOB_TOOL_DESCRIPTION,
    inputSchema: GlobInputSchema,

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

        const baseDir = (params.baseDirectory as string) || process.cwd();
        const resolvedBase = path.resolve(baseDir);

        const matches = await globMatch(pattern, resolvedBase);
        const durationMs = Date.now() - startTime;

        if (matches.length === 0) {
          return {
            ok: true,
            status: "completed",
            result: { type: "text", text: "No files matched the pattern." },
            metadata: { durationMs },
          };
        }

        return {
          ok: true,
          status: "completed",
          result: {
            type: "text",
            text: matches.join("\n"),
          },
          metadata: {
            durationMs,
            matchCount: matches.length,
          },
        };
      } catch (error) {
        const durationMs = Date.now() - startTime;
        const message = error instanceof Error ? error.message : String(error);

        return {
          ok: false,
          status: "failed",
          result: { type: "text", text: `Glob error: ${message}` },
          metadata: { durationMs },
        };
      }
    },
  };
}

async function globMatch(pattern: string, baseDir: string): Promise<string[]> {
  const fs = await import("node:fs/promises");
  const results: string[] = [];

  // Convert glob pattern to regex
  // Handle ** for recursive matching
  const regexPattern = pattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, "{{DOUBLE_STAR}}")
    .replace(/\*/g, "[^/]*")
    .replace(/\?\?/g, "{{DOUBLE_QUEST}}")
    .replace(/\?/g, "[^/]")
    .replace(/\{\{DOUBLE_STAR\}\}/g, ".*")
    .replace(/\{\{DOUBLE_QUEST\}\}/g, "[^/][^/]");

  const regex = new RegExp(`^${regexPattern}$`);

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      // Skip directories we can't read
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

      if (regex.test(relativePath) || regex.test(fullPath)) {
        if (entry.isFile()) {
          results.push(relativePath);
        }
      }

      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        await walk(fullPath);
      }
    }
  }

  await walk(baseDir);

  // Sort results
  return results.toSorted();
}

// Tool definition for registration
export const globToolDefinition = {
  name: GLOB_TOOL_NAME,
  description: GLOB_TOOL_DESCRIPTION,
  inputSchema: GlobInputSchema,
};
