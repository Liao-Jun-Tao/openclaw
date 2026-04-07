/**
 * Shared tool result helpers aligned with OpenClaw's expected
 * `{ content: ContentBlock[] }` shape.
 */

export interface TextContent {
  type: "text";
  text: string;
}

export interface ToolResult {
  content: TextContent[];
}

export function textResult(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

export function jsonResult(data: unknown): ToolResult {
  return textResult(typeof data === "string" ? data : JSON.stringify(data, null, 2));
}
