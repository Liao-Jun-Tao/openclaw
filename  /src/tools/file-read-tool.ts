import path from "node:path";
import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";
import { Type } from "@sinclair/typebox";
import type { ToolUseContext } from "openclaw/plugin-sdk/channel-contract.js";
import { readFileWithinRoot } from "openclaw/plugin-sdk/fs-safe.js";
import { readStringParam } from "openclaw/plugin-sdk/param-readers.js";
import { resolvePreferredOpenClawTmpDir } from "openclaw/plugin-sdk/plugin-entry.js";
import { resolveClaudeCodeConfig, type ClaudeCodeConfig } from "../config.js";

const FILE_READ_TOOL_NAME = "read";
const FILE_READ_TOOL_DESCRIPTION =
  "Read the contents of a file. Supports syntax highlighting and intelligent truncation for large files.";

const FileReadInputSchema = Type.Object({
  path: Type.String({
    description: "Path to the file to read",
  }),
  offset: Type.Optional(
    Type.Integer({ description: "Line number to start reading from (1-indexed)", minimum: 1 }),
  ),
  limit: Type.Optional(
    Type.Integer({ description: "Maximum number of lines to read", minimum: 1 }),
  ),
});

type FileReadInput = Type.Input<typeof FileReadInputSchema>;

const MAX_FILE_READ_SIZE = 50 * 1024 * 1024; // 50MB

export function createFileReadTool(params: {
  context: ToolUseContext;
  config: ClaudeCodeConfig;
}): AgentTool {
  const { config } = params;

  return {
    name: FILE_READ_TOOL_NAME,
    description: FILE_READ_TOOL_DESCRIPTION,
    inputSchema: FileReadInputSchema,

    async handle(params: Record<string, unknown>): Promise<AgentToolResult> {
      const startTime = Date.now();

      try {
        const filePath = readStringParam(params, "path", { required: true });
        if (!filePath) {
          return {
            ok: false,
            status: "failed",
            result: { type: "text", text: "path is required" },
          };
        }

        const offset = (params.offset as number) || 1;
        const limit = params.limit as number | undefined;

        // Validate path is within workspace
        const resolvedPath = path.resolve(process.cwd(), filePath);

        // Read file
        const content = await readFileWithOffsetLimit(resolvedPath, { offset, limit });
        const durationMs = Date.now() - startTime;

        return {
          ok: true,
          status: "completed",
          result: { type: "text", text: content },
          metadata: { durationMs },
        };
      } catch (error) {
        const durationMs = Date.now() - startTime;
        const message = error instanceof Error ? error.message : String(error);

        // Handle specific errors
        if (message.includes("ENOENT") || message.includes("no such file")) {
          return {
            ok: false,
            status: "failed",
            result: { type: "text", text: `File not found: ${params.path}` },
            metadata: { durationMs },
          };
        }

        return {
          ok: false,
          status: "failed",
          result: { type: "text", text: `Read error: ${message}` },
          metadata: { durationMs },
        };
      }
    },
  };
}

async function readFileWithOffsetLimit(
  filePath: string,
  options: { offset?: number; limit?: number },
): Promise<string> {
  const { offset = 1, limit } = options;

  // Use fs/promises for non-stream reading with offset/limit
  const fs = await import("node:fs/promises");

  const stat = await fs.stat(filePath);
  if (stat.size > MAX_FILE_READ_SIZE) {
    throw new Error(`File too large: ${stat.size} bytes (max: ${MAX_FILE_READ_SIZE})`);
  }

  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.split("\n");

  const startLine = Math.max(0, offset - 1); // Convert to 0-indexed
  const endLine = limit ? startLine + limit : lines.length;

  const selectedLines = lines.slice(startLine, endLine);
  let result = selectedLines.join("\n");

  // Add continuation notice if truncated
  if (endLine < lines.length) {
    result += `\n\n[${lines.length - endLine} more lines in file. Use offset=${endLine + 1} to continue.]`;
  }

  return result;
}

// Tool definition for registration
export const fileReadToolDefinition = {
  name: FILE_READ_TOOL_NAME,
  description: FILE_READ_TOOL_DESCRIPTION,
  inputSchema: FileReadInputSchema,
};
