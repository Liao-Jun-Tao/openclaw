import { Type } from "@sinclair/typebox";
import { buildTool } from "./build-tool.js";
import { textResult } from "./tool-result.js";

// ---------------------------------------------------------------------------
// Progress tracker (ported from Claude Code progress tracking)
// ---------------------------------------------------------------------------

const TOKEN_RATES = {
  INPUT_COST_PER_1M: 1.5,
  OUTPUT_COST_PER_1M: 7.5,
};

export class ProgressTracker {
  turnCount = 0;
  toolUseCount = 0;
  totalInputTokens = 0;
  totalOutputTokens = 0;
  startTime = Date.now();
  maxTokens: number;
  private toolActivities = new Map<string, { callCount: number; totalDurationMs: number }>();

  constructor(maxTokens = 200_000) {
    this.maxTokens = maxTokens;
  }

  recordTurn(inputTokens: number, outputTokens: number): void {
    this.turnCount++;
    this.totalInputTokens += inputTokens;
    this.totalOutputTokens += outputTokens;
  }

  recordToolUse(toolName: string, durationMs: number): void {
    this.toolUseCount++;
    const existing = this.toolActivities.get(toolName);
    if (existing) {
      existing.callCount++;
      existing.totalDurationMs += durationMs;
    } else {
      this.toolActivities.set(toolName, { callCount: 1, totalDurationMs: durationMs });
    }
  }

  get totalTokens(): number {
    return this.totalInputTokens + this.totalOutputTokens;
  }

  get progress(): number {
    return Math.min(100, (this.totalTokens / this.maxTokens) * 100);
  }

  get estimatedCost(): number {
    return (
      (this.totalInputTokens / 1_000_000) * TOKEN_RATES.INPUT_COST_PER_1M +
      (this.totalOutputTokens / 1_000_000) * TOKEN_RATES.OUTPUT_COST_PER_1M
    );
  }

  get remaining(): number {
    return Math.max(0, this.maxTokens - this.totalTokens);
  }

  getShortSummary(): string {
    return `${this.totalTokens.toLocaleString()} tokens | ${this.toolUseCount} tools | ${this.progress.toFixed(0)}%`;
  }

  getDetailedSummary(): string {
    const lines = [
      `Progress: ${this.progress.toFixed(1)}%`,
      `Tokens: ${this.totalInputTokens.toLocaleString()} in / ${this.totalOutputTokens.toLocaleString()} out`,
      `Tools: ${this.toolUseCount} calls across ${this.turnCount} turns`,
      `Cost: ~$${this.estimatedCost.toFixed(4)}`,
      `Remaining: ~${this.remaining.toLocaleString()} tokens`,
    ];

    if (this.toolActivities.size > 0) {
      lines.push("", "Tool breakdown:");
      const sorted = [...this.toolActivities.entries()].toSorted(
        ([, a], [, b]) => b.callCount - a.callCount,
      );
      for (const [name, stats] of sorted.slice(0, 5)) {
        const avg = (stats.totalDurationMs / stats.callCount).toFixed(0);
        lines.push(`  ${name}: ${stats.callCount}x (avg ${avg}ms)`);
      }
    }

    const status = this.progress >= 95 ? "CRITICAL" : this.progress >= 85 ? "WARNING" : "NORMAL";
    if (status !== "NORMAL") {
      lines.push("", `Status: ${status}`);
    }

    return lines.join("\n");
  }

  reset(): void {
    this.turnCount = 0;
    this.toolUseCount = 0;
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
    this.startTime = Date.now();
    this.toolActivities.clear();
  }
}

// ---------------------------------------------------------------------------
// Progress tool (buildTool-based)
// ---------------------------------------------------------------------------

const ProgressParameters = Type.Object(
  {
    format: Type.Optional(
      Type.Unsafe<"short" | "detailed">({
        type: "string",
        enum: ["short", "detailed"],
        description: "Output format",
        default: "short",
      }),
    ),
  },
  { additionalProperties: false },
);

const sharedTracker = new ProgressTracker();

export function createProgressTool() {
  return buildTool({
    name: "progress",
    description:
      "View conversation progress including token usage, tool calls, and estimated cost.",
    parameters: ProgressParameters,
    isReadOnly: true,
    isConcurrencySafe: true,

    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const format = (rawParams.format as string) || "short";
      const summary =
        format === "detailed"
          ? sharedTracker.getDetailedSummary()
          : sharedTracker.getShortSummary();
      return textResult(summary);
    },
  });
}

// ---------------------------------------------------------------------------
// Budget tool (buildTool-based)
// ---------------------------------------------------------------------------

const BudgetParameters = Type.Object(
  {
    showBreakdown: Type.Optional(
      Type.Boolean({ description: "Show detailed breakdown", default: false }),
    ),
  },
  { additionalProperties: false },
);

export function createBudgetTool() {
  return buildTool({
    name: "budget",
    description: "View token budget status and remaining context space.",
    parameters: BudgetParameters,
    isReadOnly: true,
    isConcurrencySafe: true,

    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const status =
        sharedTracker.progress >= 95
          ? "CRITICAL"
          : sharedTracker.progress >= 85
            ? "WARNING"
            : "NORMAL";

      let text = `Token Budget: ${status}\n`;
      text += `Progress: ${sharedTracker.progress.toFixed(1)}% (${sharedTracker.totalTokens.toLocaleString()} / ${sharedTracker.maxTokens.toLocaleString()})\n`;
      text += `Remaining: ~${sharedTracker.remaining.toLocaleString()} tokens\n`;
      text += `Cost: ~$${sharedTracker.estimatedCost.toFixed(4)}`;
      return textResult(text);
    },
  });
}

export { sharedTracker };
