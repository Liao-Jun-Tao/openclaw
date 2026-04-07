/**
 * Claude Code 风格的进度追踪系统
 * 基于 Claude Code CLI 的 progress tracking 设计
 */

import type { AgentToolResult } from "@mariozechner/pi-agent-core";

// ============================================================================
// 常量
// ============================================================================

const PROGRESS_THRESHOLDS = {
  WARNING_TOKENS: 10000,       // 10k tokens 开始警告
  CRITICAL_TOKENS: 5000,      // 5k tokens 严重警告
  TOOL_USE_WARNING: 10,       // 10 次工具使用
  MAX_OUTPUT_CHARS: 50000,    // 50k 字符输出限制
};

const TOKEN_RATES = {
  INPUT_COST_PER_1M: 1.5,      // Claude 3.5 Sonnet
  OUTPUT_COST_PER_1M: 7.5,
};

// ============================================================================
// 类型
// ============================================================================

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface ToolActivity {
  toolName: string;
  callCount: number;
  lastCallTime: number;
  averageDuration: number;
}

export interface ProgressReport {
  turnCount: number;
  toolUseCount: number;
  tokenUsage: TokenUsage;
  progress: number;           // 0-100
  estimatedRemaining: number; // 剩余 tokens
  estimatedCost: number;
  activities: ToolActivity[];
  warnings: string[];
  status: "normal" | "warning" | "critical";
}

export interface ProgressTracker {
  turnCount: number;
  toolUseCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  startTime: number;
  toolActivities: Map<string, ToolActivity>;
  maxTokens: number;
}

// ============================================================================
// 进度追踪器
// ============================================================================

export class ProgressTracker {
  private turnCount: number = 0;
  private toolUseCount: number = 0;
  private totalInputTokens: number = 0;
  private totalOutputTokens: number = 0;
  private startTime: number = Date.now();
  private toolActivities: Map<string, ToolActivity> = new Map();
  private maxTokens: number;
  private warnings: Set<string> = new Set();

  constructor(maxTokens: number = 200000) {
    this.maxTokens = maxTokens;
  }

  // 记录一次对话回合
  recordTurn(inputTokens: number, outputTokens: number): void {
    this.turnCount++;
    this.totalInputTokens += inputTokens;
    this.totalOutputTokens += outputTokens;

    // 检查警告
    this.checkWarnings();
  }

  // 记录工具使用
  recordToolUse(toolName: string, durationMs: number): void {
    this.toolUseCount++;

    const existing = this.toolActivities.get(toolName);
    if (existing) {
      existing.callCount++;
      existing.lastCallTime = Date.now();
      existing.averageDuration =
        (existing.averageDuration * (existing.callCount - 1) + durationMs) /
        existing.callCount;
    } else {
      this.toolActivities.set(toolName, {
        toolName,
        callCount: 1,
        lastCallTime: Date.now(),
        averageDuration: durationMs,
      });
    }

    // 检查工具使用警告
    if (this.toolUseCount >= PROGRESS_THRESHOLDS.TOOL_USE_WARNING) {
      this.warnings.add(
        `High tool usage: ${this.toolUseCount} tools called`
      );
    }
  }

  // 获取 Token 使用情况
  getTokenUsage(): TokenUsage {
    const totalTokens = this.totalInputTokens + this.totalOutputTokens;
    const estimatedCost =
      (this.totalInputTokens / 1_000_000) * TOKEN_RATES.INPUT_COST_PER_1M +
      (this.totalOutputTokens / 1_000_000) * TOKEN_RATES.OUTPUT_COST_PER_1M;

    return {
      inputTokens: this.totalInputTokens,
      outputTokens: this.totalOutputTokens,
      totalTokens,
      estimatedCost,
    };
  }

  // 获取进度百分比
  getProgress(): number {
    const total = this.totalInputTokens + this.totalOutputTokens;
    return Math.min(100, (total / this.maxTokens) * 100);
  }

  // 检查警告条件
  private checkWarnings(): void {
    const remaining = this.maxTokens - (this.totalInputTokens + this.totalOutputTokens);

    if (remaining <= PROGRESS_THRESHOLDS.CRITICAL_TOKENS) {
      this.warnings.add(
        `Critical: Only ~${remaining} tokens remaining!`
      );
    } else if (remaining <= PROGRESS_THRESHOLDS.WARNING_TOKENS) {
      this.warnings.add(
        `Warning: ~${remaining} tokens remaining`
      );
    }
  }

  // 生成完整报告
  generateReport(): ProgressReport {
    const tokenUsage = this.getTokenUsage();
    const progress = this.getProgress();
    const remaining = this.maxTokens - tokenUsage.totalTokens;

    // 确定状态
    let status: ProgressReport["status"] = "normal";
    if (progress >= 95) {
      status = "critical";
    } else if (progress >= 85) {
      status = "warning";
    }

    // 收集警告
    const warnings = Array.from(this.warnings);

    // 活动排序（按调用次数）
    const activities = Array.from(this.toolActivities.values())
      .sort((a, b) => b.callCount - a.callCount);

    return {
      turnCount: this.turnCount,
      toolUseCount: this.toolUseCount,
      tokenUsage,
      progress,
      estimatedRemaining: remaining,
      estimatedCost: tokenUsage.estimatedCost,
      activities,
      warnings,
      status,
    };
  }

  // 获取简短摘要
  getShortSummary(): string {
    const usage = this.getTokenUsage();
    const progress = this.getProgress().toFixed(0);
    return `${usage.totalTokens} tokens | ${this.toolUseCount} tools | ${progress}%`;
  }

  // 获取详细摘要
  getDetailedSummary(): string {
    const report = this.generateReport();
    const lines = [
      `Progress: ${report.progress.toFixed(1)}%`,
      `Tokens: ${report.tokenUsage.inputTokens.toLocaleString()} in / ${report.tokenUsage.outputTokens.toLocaleString()} out`,
      `Tools: ${report.toolUseCount} calls`,
      `Cost: ~$${report.estimatedCost.toFixed(4)}`,
    ];

    if (report.warnings.length > 0) {
      lines.push("");
      lines.push("Warnings:");
      report.warnings.forEach((w) => lines.push(`  ⚠️ ${w}`));
    }

    return lines.join("\n");
  }

  // 重置
  reset(): void {
    this.turnCount = 0;
    this.toolUseCount = 0;
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
    this.startTime = Date.now();
    this.toolActivities.clear();
    this.warnings.clear();
  }
}

// ============================================================================
// 工具: 进度查询
// ============================================================================

export function createProgressTool() {
  const PROGRESS_TOOL_NAME = "progress";
  const PROGRESS_TOOL_DESCRIPTION =
    "View progress of the current conversation including token usage, tool calls, and estimated cost.";

  const ProgressInputSchema = {
    type: "object" as const,
    properties: {
      format: {
        type: "string" as const,
        enum: ["short", "detailed"],
        description: "Output format",
        default: "short",
      },
    },
  };

  // 全局追踪器实例
  const globalTracker = new ProgressTracker();

  return {
    name: PROGRESS_TOOL_NAME,
    description: PROGRESS_TOOL_DESCRIPTION,
    inputSchema: ProgressInputSchema,

    async handle(params: Record<string, unknown>): Promise<AgentToolResult> {
      const format = (params.format as string) || "short";

      const summary =
        format === "detailed"
          ? globalTracker.getDetailedSummary()
          : globalTracker.getShortSummary();

      const report = globalTracker.generateReport();

      return {
        ok: true,
        status: "completed",
        result: {
          type: "text",
          text: summary,
        },
        metadata: {
          turnCount: report.turnCount,
          toolUseCount: report.toolUseCount,
          progress: report.progress,
          tokenUsage: report.tokenUsage,
          estimatedCost: report.estimatedCost,
          status: report.status,
        },
      };
    },
  };
}

// ============================================================================
// 工具: Token 预算状态
// ============================================================================

export function createBudgetTool() {
  const BUDGET_TOOL_NAME = "budget";
  const BUDGET_TOOL_DESCRIPTION =
    "View token budget status and remaining context space. Shows warnings when approaching limits.";

  const BudgetInputSchema = {
    type: "object" as const,
    properties: {
      showBreakdown: {
        type: "boolean",
        description: "Show detailed breakdown",
        default: false,
      },
    },
  };

  const globalTracker = new ProgressTracker();

  return {
    name: BUDGET_TOOL_NAME,
    description: BUDGET_TOOL_DESCRIPTION,
    inputSchema: BudgetInputSchema,

    async handle(params: Record<string, unknown>): Promise<AgentToolResult> {
      const showBreakdown = (params.showBreakdown as boolean) || false;
      const report = globalTracker.generateReport();

      let text = `Token Budget Status: ${report.status.toUpperCase()}\n`;
      text += `Progress: ${report.progress.toFixed(1)}% (${report.tokenUsage.totalTokens.toLocaleString()} / ${globalTracker["maxTokens"].toLocaleString()})\n`;
      text += `Remaining: ~${report.estimatedRemaining.toLocaleString()} tokens\n`;

      if (report.tokenUsage.totalTokens > 0) {
        text += `\nEstimated Cost: ~$${report.estimatedCost.toFixed(4)}\n`;
      }

      if (showBreakdown && report.activities.length > 0) {
        text += `\nTool Activity (top 5):\n`;
        report.activities.slice(0, 5).forEach((a) => {
          text += `  ${a.toolName}: ${a.callCount}x (avg ${a.averageDuration.toFixed(0)}ms)\n`;
        });
      }

      if (report.warnings.length > 0) {
        text += `\n⚠️ Warnings:\n`;
        report.warnings.forEach((w) => {
          text += `  - ${w}\n`;
        });
      }

      return {
        ok: true,
        status: "completed",
        result: { type: "text", text },
        metadata: {
          status: report.status,
          progress: report.progress,
          remaining: report.estimatedRemaining,
        },
      };
    },
  };
}

// ============================================================================
// 导出
// ============================================================================

export { ProgressTracker as default };
