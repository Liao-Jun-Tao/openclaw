import { Type } from "@sinclair/typebox";
import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";
import { writeFileWithinRoot } from "openclaw/plugin-sdk/fs-safe.js";
import { readStringParam } from "openclaw/plugin-sdk/param-readers.js";
import type { ToolUseContext } from "openclaw/plugin-sdk/channel-contract.js";
import path from "node:path";
import { resolveClaudeCodeConfig, type ClaudeCodeConfig } from "../config.js";

const FILE_EDIT_TOOL_NAME = "edit";
const FILE_EDIT_TOOL_DESCRIPTION =
  "Make targeted edits to a single file. Use for updating, fixing, or refactoring code.";

const FileEditInputSchema = Type.Object({
  path: Type.String({
    description: "Path to the file to edit",
  }),
  oldText: Type.String({
    description: "Exact text in the file to replace. Must match the file content exactly.",
  }),
  newText: Type.String({
    description: "Replacement text",
  }),
});

type FileEditInput = Type.Input<typeof FileEditInputSchema>;

const MAX_EDIT_FILE_SIZE = 1024 * 1024 * 1024; // 1GB - same as Claude Code

export function createFileEditTool(params: {
  context: ToolUseContext;
  config: ClaudeCodeConfig;
}): AgentTool {
  const { config } = params;

  // Check if readonly mode is enabled
  if (config.readonlyMode) {
    return {
      name: FILE_EDIT_TOOL_NAME,
      description: "File editing is disabled (readonly mode)",
      inputSchema: FileEditInputSchema,
      async handle(): Promise<AgentToolResult> {
        return {
          ok: false,
          status: "rejected",
          result: {
            type: "text",
            text: "File editing is disabled in readonly mode",
          },
        };
      },
    };
  }

  return {
    name: FILE_EDIT_TOOL_NAME,
    description: FILE_EDIT_TOOL_DESCRIPTION,
    inputSchema: FileEditInputSchema,

    async handle(params: Record<string, unknown>): Promise<AgentToolResult> {
      const startTime = Date.now();

      try {
        const filePath = readStringParam(params, "path", { required: true });
        const oldText = readStringParam(params, "oldText", { required: true });
        const newText = readStringParam(params, "newText", { required: true });

        if (!filePath || !oldText) {
          return {
            ok: false,
            status: "failed",
            result: { type: "text", text: "path and oldText are required" },
          };
        }

        // Validate paths
        const resolvedPath = path.resolve(process.cwd(), filePath);

        // Read current file content
        const fs = await import("node:fs/promises");

        let content: string;
        try {
          content = await fs.readFile(resolvedPath, "utf-8");
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return {
              ok: false,
              status: "failed",
              result: { type: "text", text: `File not found: ${filePath}` },
              metadata: { durationMs: Date.now() - startTime },
            };
          }
          throw error;
        }

        // Check file size
        const stat = await fs.stat(resolvedPath);
        if (stat.size > MAX_EDIT_FILE_SIZE) {
          return {
            ok: false,
            status: "failed",
            result: {
              type: "text",
              text: `File too large to edit: ${stat.size} bytes (max: ${MAX_EDIT_FILE_SIZE})`,
            },
            metadata: { durationMs: Date.now() - startTime },
          };
        }

        // Find and replace
        const matchIndex = content.indexOf(oldText);
        if (matchIndex === -1) {
          // Try to find similar text for helpful error
          const similar = findSimilarText(content, oldText);
          return {
            ok: false,
            status: "failed",
            result: {
              type: "text",
              text: `Text to replace not found in file. ${similar}`,
            },
            metadata: { durationMs: Date.now() - startTime },
          };
        }

        // Perform the edit
        const newContent = content.slice(0, matchIndex) + newText + content.slice(matchIndex + oldText.length);

        // Write the file
        await fs.writeFile(resolvedPath, newContent, "utf-8");

        const durationMs = Date.now() - startTime;

        return {
          ok: true,
          status: "completed",
          result: {
            type: "text",
            text: `Edited ${path.basename(filePath)}`,
          },
          metadata: { durationMs },
        };
      } catch (error) {
        const durationMs = Date.now() - startTime;
        const message = error instanceof Error ? error.message : String(error);

        return {
          ok: false,
          status: "failed",
          result: { type: "text", text: `Edit error: ${message}` },
          metadata: { durationMs },
        };
      }
    },
  };
}

function findSimilarText(content: string, target: string): string {
  // Simple similarity check - find if there's something close
  const targetLines = target.split("\n");
  const contentLines = content.split("\n");

  for (let i = 0; i < contentLines.length; i++) {
    const contentLine = contentLines[i];
    for (const targetLine of targetLines) {
      if (targetLine.length > 10) {
        // Only check meaningful lines
        let distance = levenshteinDistance(targetLine.trim(), contentLine.trim());
        if (distance <= 3 && distance > 0) {
          return `Similar text found at line ${i + 1}: "${contentLine.trim()}"`;
        }
      }
    }
  }

  return "";
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Tool definition for registration
export const fileEditToolDefinition = {
  name: FILE_EDIT_TOOL_NAME,
  description: FILE_EDIT_TOOL_DESCRIPTION,
  inputSchema: FileEditInputSchema,
};
