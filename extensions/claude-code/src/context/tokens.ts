/**
 * Token counting and estimation utilities.
 * Ported from Claude Code utils/tokens.ts and services/tokenEstimation.ts.
 */

const CHARS_PER_TOKEN = 4;
const OVERHEAD_PER_MESSAGE = 4;

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export interface MessageTokenEstimate {
  role: string;
  contentTokens: number;
  overheadTokens: number;
  totalTokens: number;
}

export function estimateMessageTokens(messages: Array<{ role: string; content: string }>): {
  perMessage: MessageTokenEstimate[];
  total: number;
} {
  const perMessage: MessageTokenEstimate[] = [];
  let total = 0;

  for (const msg of messages) {
    const contentTokens = estimateTokenCount(msg.content);
    const entry: MessageTokenEstimate = {
      role: msg.role,
      contentTokens,
      overheadTokens: OVERHEAD_PER_MESSAGE,
      totalTokens: contentTokens + OVERHEAD_PER_MESSAGE,
    };
    perMessage.push(entry);
    total += entry.totalTokens;
  }

  return { perMessage, total };
}

// ---------------------------------------------------------------------------
// Context window tracking
// ---------------------------------------------------------------------------

export interface ContextWindowStats {
  maxTokens: number;
  usedTokens: number;
  remainingTokens: number;
  usagePercent: number;
  status: "normal" | "warning" | "critical";
}

export function computeContextStats(usedTokens: number, maxTokens: number): ContextWindowStats {
  const remainingTokens = Math.max(0, maxTokens - usedTokens);
  const usagePercent = maxTokens > 0 ? (usedTokens / maxTokens) * 100 : 0;

  let status: ContextWindowStats["status"] = "normal";
  if (usagePercent >= 95) {
    status = "critical";
  } else if (usagePercent >= 80) {
    status = "warning";
  }

  return { maxTokens, usedTokens, remainingTokens, usagePercent, status };
}

export function formatContextStats(stats: ContextWindowStats): string {
  const lines = [
    `Context: ${stats.usagePercent.toFixed(1)}% used (${stats.usedTokens.toLocaleString()} / ${stats.maxTokens.toLocaleString()})`,
    `Remaining: ~${stats.remainingTokens.toLocaleString()} tokens`,
    `Status: ${stats.status.toUpperCase()}`,
  ];
  return lines.join("\n");
}
