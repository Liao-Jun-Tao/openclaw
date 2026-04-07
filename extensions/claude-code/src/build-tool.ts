/**
 * buildTool factory ported from Claude Code's Tool.ts.
 *
 * Provides safe defaults and rich metadata so each tool only declares
 * what it differs on. The resulting tool shape is compatible with
 * OpenClaw's `{ name, description, parameters, execute }` contract
 * plus optional metadata that the extension (and future core changes)
 * can inspect.
 */

import type { TObject } from "@sinclair/typebox";
import type { ToolResult } from "./tool-result.js";

// ---------------------------------------------------------------------------
// Metadata types (ported from Claude Code Tool.ts metadata fields)
// ---------------------------------------------------------------------------

export interface ToolMetadata {
  /** Tool is read-only (never mutates state). Default: false. */
  isReadOnly: boolean;
  /** Tool performs irreversible operations (delete, overwrite, send). Default: false. */
  isDestructive: boolean;
  /** Safe to run concurrently with other tools. Default: false (fail-closed). */
  isConcurrencySafe: boolean;
  /** What happens when the user sends a new message mid-execution. */
  interruptBehavior: "cancel" | "block";
  /** Maximum characters to return before truncating. */
  maxResultSizeChars: number;
  /** Whether the tool is currently enabled. */
  isEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Tool definition types
// ---------------------------------------------------------------------------

export interface BuiltTool {
  name: string;
  description: string;
  parameters: TObject;
  metadata: ToolMetadata;
  execute: (toolCallId: string, rawParams: Record<string, unknown>) => Promise<ToolResult>;
  /** Human-readable activity description for progress display. */
  getActivityDescription?: (input?: Record<string, unknown>) => string | null;
}

/**
 * Input accepted by `buildTool`. Same shape as `BuiltTool` but metadata
 * fields are optional -- `buildTool` fills in defaults.
 */
export type ToolDef = {
  name: string;
  description: string;
  parameters: TObject;
  execute: (toolCallId: string, rawParams: Record<string, unknown>) => Promise<ToolResult>;
  getActivityDescription?: (input?: Record<string, unknown>) => string | null;
} & Partial<ToolMetadata>;

// ---------------------------------------------------------------------------
// Defaults (fail-closed where it matters, matching Claude Code)
// ---------------------------------------------------------------------------

const TOOL_DEFAULTS: ToolMetadata = {
  isReadOnly: false,
  isDestructive: false,
  isConcurrencySafe: false,
  interruptBehavior: "cancel",
  maxResultSizeChars: 100_000,
  isEnabled: true,
};

// ---------------------------------------------------------------------------
// buildTool factory
// ---------------------------------------------------------------------------

/**
 * Build a complete tool from a partial definition, filling in safe defaults.
 * All tool exports should go through this so defaults live in one place.
 */
export function buildTool(def: ToolDef): BuiltTool {
  const metadata: ToolMetadata = {
    isReadOnly: def.isReadOnly ?? TOOL_DEFAULTS.isReadOnly,
    isDestructive: def.isDestructive ?? TOOL_DEFAULTS.isDestructive,
    isConcurrencySafe: def.isConcurrencySafe ?? TOOL_DEFAULTS.isConcurrencySafe,
    interruptBehavior: def.interruptBehavior ?? TOOL_DEFAULTS.interruptBehavior,
    maxResultSizeChars: def.maxResultSizeChars ?? TOOL_DEFAULTS.maxResultSizeChars,
    isEnabled: def.isEnabled ?? TOOL_DEFAULTS.isEnabled,
  };

  return {
    name: def.name,
    description: def.description,
    parameters: def.parameters,
    metadata,
    execute: def.execute,
    getActivityDescription: def.getActivityDescription,
  };
}
