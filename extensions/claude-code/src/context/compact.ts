/**
 * Context compaction system.
 * Ported from Claude Code services/compact/compact.ts.
 *
 * Supports:
 *  - Token budget management with auto/warning/critical thresholds
 *  - Compact boundary messages for conversation continuity
 *  - Manual compact tool for explicit compaction
 */

import { Type } from "@sinclair/typebox";
import { buildTool } from "../build-tool.js";
import { textResult } from "../tool-result.js";
import { estimateTokenCount, computeContextStats, formatContextStats } from "./tokens.js";

// ---------------------------------------------------------------------------
// Compaction thresholds (ported from Claude Code)
// ---------------------------------------------------------------------------

const COMPACT_THRESHOLDS = {
  AUTO_TOKEN_RATIO: 0.85,
  WARNING_TOKEN_RATIO: 0.7,
  EMERGENCY_TOKEN_RATIO: 0.95,
  MIN_TURNS_FOR_AUTO: 6,
  MIN_MESSAGES_FOR_AUTO: 10,
};

// ---------------------------------------------------------------------------
// Token budget manager
// ---------------------------------------------------------------------------

export class TokenBudgetManager {
  private maxTokens: number;
  private usedTokens = 0;

  constructor(maxTokens = 200_000) {
    this.maxTokens = maxTokens;
  }

  get usage(): number {
    return this.maxTokens > 0 ? this.usedTokens / this.maxTokens : 0;
  }

  get remaining(): number {
    return Math.max(0, this.maxTokens - this.usedTokens);
  }

  get shouldCompact(): boolean {
    return this.usage >= COMPACT_THRESHOLDS.AUTO_TOKEN_RATIO;
  }

  get isWarning(): boolean {
    return this.usage >= COMPACT_THRESHOLDS.WARNING_TOKEN_RATIO;
  }

  get isCritical(): boolean {
    return this.usage >= COMPACT_THRESHOLDS.EMERGENCY_TOKEN_RATIO;
  }

  addUsage(tokens: number): void {
    this.usedTokens += tokens;
  }

  setUsage(tokens: number): void {
    this.usedTokens = tokens;
  }

  getStats() {
    return computeContextStats(this.usedTokens, this.maxTokens);
  }
}

// ---------------------------------------------------------------------------
// Compact boundary message (ported from Claude Code createCompactBoundaryMessage)
// ---------------------------------------------------------------------------

export interface CompactBoundaryMessage {
  role: "system";
  content: string;
  metadata: {
    type: "compact_boundary";
    originalMessageCount: number;
    compactedMessageCount: number;
    originalTokens: number;
    compactedTokens: number;
    strategy: string;
    timestamp: number;
  };
}

export function createCompactBoundaryMessage(params: {
  summary: string;
  originalCount: number;
  compactedCount: number;
  originalTokens: number;
  compactedTokens: number;
  strategy: string;
}): CompactBoundaryMessage {
  return {
    role: "system",
    content: `[Conversation compacted]\n\n${params.summary}`,
    metadata: {
      type: "compact_boundary",
      originalMessageCount: params.originalCount,
      compactedMessageCount: params.compactedCount,
      originalTokens: params.originalTokens,
      compactedTokens: params.compactedTokens,
      strategy: params.strategy,
      timestamp: Date.now(),
    },
  };
}

// ---------------------------------------------------------------------------
// Compact trigger check
// ---------------------------------------------------------------------------

export interface CompactTrigger {
  shouldCompact: boolean;
  reason: string;
  severity: "none" | "warning" | "critical";
}

export function checkCompactTrigger(
  budget: TokenBudgetManager,
  messageCount: number,
  turnCount: number,
): CompactTrigger {
  if (budget.isCritical) {
    return {
      shouldCompact: true,
      reason: `Token usage at ${(budget.usage * 100).toFixed(0)}% - emergency threshold`,
      severity: "critical",
    };
  }

  if (
    budget.shouldCompact &&
    messageCount >= COMPACT_THRESHOLDS.MIN_MESSAGES_FOR_AUTO &&
    turnCount >= COMPACT_THRESHOLDS.MIN_TURNS_FOR_AUTO
  ) {
    return {
      shouldCompact: true,
      reason: `Token usage at ${(budget.usage * 100).toFixed(0)}% with ${messageCount} messages`,
      severity: "warning",
    };
  }

  if (budget.isWarning) {
    return {
      shouldCompact: false,
      reason: `Token usage at ${(budget.usage * 100).toFixed(0)}% - approaching limit`,
      severity: "warning",
    };
  }

  return {
    shouldCompact: false,
    reason: "Token usage within normal range",
    severity: "none",
  };
}

// ---------------------------------------------------------------------------
// Compact tool
// ---------------------------------------------------------------------------

const CompactParameters = Type.Object(
  {
    strategy: Type.Optional(
      Type.Unsafe<"summary" | "prune" | "hybrid">({
        type: "string",
        enum: ["summary", "prune", "hybrid"],
        description:
          "summary: LLM-generated summary of old messages. prune: drop old messages. hybrid: keep early + recent, summarize middle.",
        default: "hybrid",
      }),
    ),
    keepRecentCount: Type.Optional(
      Type.Number({
        description: "Number of recent messages to keep",
        minimum: 1,
        default: 10,
      }),
    ),
  },
  { additionalProperties: false },
);

export function createCompactTool() {
  return buildTool({
    name: "compact",
    description:
      "Compact conversation context to reduce token usage. Summarizes older messages while preserving recent context.",
    parameters: CompactParameters,
    isReadOnly: false,
    isConcurrencySafe: false,

    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const strategy = (rawParams.strategy as string) || "hybrid";
      const keepRecentCount = (rawParams.keepRecentCount as number) || 10;

      return textResult(
        `Context compaction requested (strategy: ${strategy}, keep recent: ${keepRecentCount}).\n` +
          "The agent runtime will handle compaction at the next turn boundary.",
      );
    },
  });
}

export { estimateTokenCount };
