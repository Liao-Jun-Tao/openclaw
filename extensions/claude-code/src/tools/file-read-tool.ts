import path from "node:path";
import { Type } from "@sinclair/typebox";
import { readStringParam } from "openclaw/plugin-sdk/param-readers";
import { buildTool } from "../build-tool.js";
import type { ClaudeCodeConfig } from "../config.js";
import { textResult } from "../tool-result.js";

const MAX_FILE_READ_SIZE = 50 * 1024 * 1024; // 50 MB

const FileReadParameters = Type.Object(
  {
    path: Type.String({ description: "Path to the file to read" }),
    offset: Type.Optional(
      Type.Integer({
        description: "Line number to start reading from (1-indexed)",
        minimum: 1,
      }),
    ),
    limit: Type.Optional(
      Type.Integer({ description: "Maximum number of lines to read", minimum: 1 }),
    ),
  },
  { additionalProperties: false },
);

export function createFileReadTool(config: ClaudeCodeConfig) {
  return buildTool({
    name: "read",
    description: "Read the contents of a file. Supports offset and limit for large files.",
    parameters: FileReadParameters,
    isReadOnly: true,
    isConcurrencySafe: true,
    isDestructive: false,

    getActivityDescription(input) {
      const p = input?.path;
      return typeof p === "string" ? `Reading ${p}` : null;
    },

    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      try {
        const filePath = readStringParam(rawParams, "path", { required: true });
        if (!filePath) {
          return textResult("path is required");
        }

        const offset = (rawParams.offset as number) ?? 1;
        const limit = rawParams.limit as number | undefined;
        const resolvedPath = path.resolve(process.cwd(), filePath);

        const content = await readFileWithOffsetLimit(resolvedPath, { offset, limit });
        return textResult(content);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("ENOENT") || message.includes("no such file")) {
          return textResult(`File not found: ${rawParams.path}`);
        }
        return textResult(`Read error: ${message}`);
      }
    },
  });
}

async function readFileWithOffsetLimit(
  filePath: string,
  options: { offset?: number; limit?: number },
): Promise<string> {
  const { offset = 1, limit } = options;
  const fs = await import("node:fs/promises");

  const stat = await fs.stat(filePath);
  if (stat.size > MAX_FILE_READ_SIZE) {
    throw new Error(`File too large: ${stat.size} bytes (max: ${MAX_FILE_READ_SIZE})`);
  }

  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const startLine = Math.max(0, offset - 1);
  const endLine = limit ? startLine + limit : lines.length;
  const selectedLines = lines.slice(startLine, endLine);
  let result = selectedLines.join("\n");

  if (endLine < lines.length) {
    result += `\n\n[${lines.length - endLine} more lines. Use offset=${endLine + 1} to continue.]`;
  }

  return result;
}
