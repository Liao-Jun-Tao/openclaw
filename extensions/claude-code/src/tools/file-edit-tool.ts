import path from "node:path";
import { Type } from "@sinclair/typebox";
import { readStringParam } from "openclaw/plugin-sdk/param-readers";
import { buildTool } from "../build-tool.js";
import type { ClaudeCodeConfig } from "../config.js";
import { textResult } from "../tool-result.js";

const MAX_EDIT_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB

const FileEditParameters = Type.Object(
  {
    path: Type.String({ description: "Path to the file to edit" }),
    oldText: Type.String({
      description: "Exact text in the file to replace. Must match the file content exactly.",
    }),
    newText: Type.String({ description: "Replacement text" }),
  },
  { additionalProperties: false },
);

export function createFileEditTool(config: ClaudeCodeConfig) {
  if (config.readonlyMode) {
    return buildTool({
      name: "edit",
      description: "File editing is disabled (readonly mode)",
      parameters: FileEditParameters,
      isEnabled: false,
      async execute() {
        return textResult("File editing is disabled in readonly mode.");
      },
    });
  }

  return buildTool({
    name: "edit",
    description: "Make targeted edits to a single file using oldText/newText replacement.",
    parameters: FileEditParameters,
    isDestructive: true,
    isConcurrencySafe: false,
    isReadOnly: false,

    getActivityDescription(input) {
      const p = input?.path;
      return typeof p === "string" ? `Editing ${p}` : null;
    },

    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      try {
        const filePath = readStringParam(rawParams, "path", { required: true });
        const oldText = readStringParam(rawParams, "oldText", { required: true });
        const newText = readStringParam(rawParams, "newText") ?? "";

        if (!filePath || oldText === undefined) {
          return textResult("path and oldText are required");
        }

        const resolvedPath = path.resolve(process.cwd(), filePath);
        const fs = await import("node:fs/promises");

        let content: string;
        try {
          content = await fs.readFile(resolvedPath, "utf-8");
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return textResult(`File not found: ${filePath}`);
          }
          throw error;
        }

        const stat = await fs.stat(resolvedPath);
        if (stat.size > MAX_EDIT_FILE_SIZE) {
          return textResult(`File too large to edit: ${stat.size} bytes`);
        }

        const matchIndex = content.indexOf(oldText);
        if (matchIndex === -1) {
          const hint = findSimilarText(content, oldText);
          return textResult(`Text to replace not found in file.${hint ? ` ${hint}` : ""}`);
        }

        const newContent =
          content.slice(0, matchIndex) + newText + content.slice(matchIndex + oldText.length);
        await fs.writeFile(resolvedPath, newContent, "utf-8");

        return textResult(`Edited ${path.basename(filePath)}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return textResult(`Edit error: ${message}`);
      }
    },
  });
}

function findSimilarText(content: string, target: string): string {
  const targetLines = target.split("\n");
  const contentLines = content.split("\n");

  for (let i = 0; i < contentLines.length; i++) {
    const contentLine = contentLines[i];
    for (const targetLine of targetLines) {
      if (targetLine.length > 10) {
        const distance = levenshteinDistance(targetLine.trim(), contentLine.trim());
        if (distance <= 3 && distance > 0) {
          return `Similar text found at line ${i + 1}: "${contentLine.trim()}"`;
        }
      }
    }
  }
  return "";
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }

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
