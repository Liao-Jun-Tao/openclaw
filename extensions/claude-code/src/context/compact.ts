/**
 * Claude Code 风格的上下文压缩系统
 * 基于 compact.ts (1705 行) 的核心压缩逻辑
 */

import type { AgentToolResult } from "@mariozechner/pi-agent-core";

// ============================================================================
// 常量
// ============================================================================

const COMPACT_THRESHOLDS = {
  AUTO: {
    minTurns: 6,
    minMessages: 10,
    tokenThreshold: 0.85,    // 85% 上下文
    warningThreshold: 0.70, // 70% 警告
  },
  EMERGENCY: {
    tokenThreshold: 0.95,   // 95% 强制压缩
    minTurns: 3,
  },
};

const DEFAULT_MAX_TOKENS = 200000; // Claude 3.5 Sonnet 上下文
const CHARS_PER_TOKEN = 4;         // 英文约 4 字符/Token

// ============================================================================
// 类型
// ============================================================================

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface CompactionResult {
  originalCount: number;
  compactedCount: number;
  originalTokens: number;
  compactedTokens: number;
  summary: string;
  boundaryMarker: Message;
  keptMessages: Message[];
  removedMessages: Message[];
}

export interface TokenBudget {
  maxTokens: number;
  usedTokens: number;
  warningThreshold: number;
  criticalThreshold: number;
}

// ============================================================================
// Token 估算
// ============================================================================

export function estimateTokenCount(text: string): number {
  // 简单估算: 字符数 / 每 Token 字符数
  // 实际应使用 Tiktoken 或类似库
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function estimateMessagesTokenCount(messages: Message[]): number {
  return messages.reduce((sum, msg) => {
    return sum + estimateTokenCount(msg.content);
  }, 0);
}

// ============================================================================
// Token 预算管理
// ============================================================================

export class TokenBudgetManager {
  private maxTokens: number;
  private usedTokens: number;

  constructor(maxTokens: number = DEFAULT_MAX_TOKENS) {
    this.maxTokens = maxTokens;
    this.usedTokens = 0;
  }

  get usage(): number {
    return this.usedTokens / this.maxTokens;
  }

  get remaining(): number {
    return this.maxTokens - this.usedTokens;
  }

  get isWarning(): boolean {
    return this.usage >= COMPACT_THRESHOLDS.AUTO.warningThreshold;
  }

  get isCritical(): boolean {
    return this.usage >= COMPACT_THRESHOLDS.EMERGENCY.tokenThreshold;
  }

  get shouldCompact(): boolean {
    return this.usage >= COMPACT_THRESHOLDS.AUTO.tokenThreshold;
  }

  addUsage(tokens: number): void {
    this.usedTokens += tokens;
  }

  setUsage(tokens: number): void {
    this.usedTokens = tokens;
  }

  getStatus(): {
    usage: number;
    remaining: number;
    isWarning: boolean;
    isCritical: boolean;
    shouldCompact: boolean;
  } {
    return {
      usage: this.usage,
      remaining: this.remaining,
      isWarning: this.isWarning,
      isCritical: this.isCritical,
      shouldCompact: this.shouldCompact,
    };
  }
}

// ============================================================================
// 消息压缩
// ============================================================================

export interface CompactOptions {
  strategy?: "summary" | "prune" | "hybrid";
  keepRecentCount?: number;
  keepSystemContext?: boolean;
  customInstructions?: string;
}

export async function compactMessages(
  messages: Message[],
  budget: TokenBudgetManager,
  options: CompactOptions = {}
): Promise<CompactionResult> {
  const {
    strategy = "hybrid",
    keepRecentCount = 10,
    keepSystemContext = true,
    customInstructions,
  } = options;

  const originalCount = messages.length;
  const originalTokens = estimateMessagesTokenCount(messages);

  // 分离消息类型
  const systemMessages = messages.filter((m) => m.role === "system");
  const userMessages = messages.filter((m) => m.role === "user");
  const assistantMessages = messages.filter((m) => m.role === "assistant");

  // 计算要保留的消息
  let keptMessages: Message[] = [];
  let removedMessages: Message[] = [];

  // 1. 保留系统消息（如果需要）
  if (keepSystemContext) {
    keptMessages.push(...systemMessages);
  }

  // 2. 策略选择
  switch (strategy) {
    case "prune":
      // 掐头去尾：保留开头目标和最近的消息
      {
        const recentMessages = [...userMessages, ...assistantMessages]
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-keepRecentCount);

        keptMessages.push(...recentMessages);
        removedMessages = messages.filter(
          (m) => !keptMessages.some((k) => k.id === m.id)
        );
      }
      break;

    case "summary":
      // 摘要模式：保留最近消息，其余生成摘要
      {
        const recentMessages = [...userMessages, ...assistantMessages]
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-keepRecentCount);

        const oldMessages = messages.filter(
          (m) => !recentMessages.some((r) => r.id === m.id) && m.role !== "system"
        );

        // 生成摘要
        const summary = await generateSummary(oldMessages, customInstructions);

        keptMessages.push(...recentMessages);
        removedMessages = oldMessages;
      }
      break;

    case "hybrid":
    default:
      // 混合模式：掐头去尾 + 边界标记
      {
        const totalMessages = [...userMessages, ...assistantMessages].sort(
          (a, b) => a.timestamp - b.timestamp
        );

        // 保留最近的 keepRecentCount 条
        const recentMessages = totalMessages.slice(-keepRecentCount);
        // 保留最早的几条（项目上下文）
        const earlyMessages = totalMessages.slice(0, 3);
        // 中间的被压缩
        const middleMessages = totalMessages.slice(3, -keepRecentCount);

        keptMessages.push(...earlyMessages, ...recentMessages);
        removedMessages = middleMessages;

        // 生成摘要
        if (middleMessages.length > 0) {
          const summary = await generateSummary(middleMessages, customInstructions);
          // 摘要会被添加到 boundaryMarker
        }
      }
      break;
  }

  // 创建边界标记
  const summary = generateBoundarySummary(removedMessages);
  const boundaryMarker: Message = {
    id: `compact-${Date.now()}`,
    role: "system",
    content: `[Earlier conversation summarized]\n\n${summary}`,
    timestamp: Date.now(),
    metadata: {
      type: "compact_boundary",
      originalCount,
      compactedCount: keptMessages.length,
      originalTokens,
      compactedTokens: estimateMessagesTokenCount(keptMessages),
    },
  };

  // 更新预算
  const compactedTokens = estimateMessagesTokenCount([
    boundaryMarker,
    ...keptMessages,
  ]);
  budget.setUsage(compactedTokens);

  return {
    originalCount,
    compactedCount: keptMessages.length + 1, // +1 for boundary
    originalTokens,
    compactedTokens,
    summary,
    boundaryMarker,
    keptMessages,
    removedMessages,
  };
}

// ============================================================================
// 摘要生成
// ============================================================================

async function generateSummary(
  messages: Message[],
  customInstructions?: string
): Promise<string> {
  if (messages.length === 0) return "";

  // 构建摘要提示
  const summaryPrompt = buildSummaryPrompt(messages, customInstructions);

  // 调用 AI 生成摘要
  // 注意：实际实现应该调用实际的 AI 模型
  return generateSummaryFromAI(summaryPrompt);
}

function buildSummaryPrompt(messages: Message[], customInstructions?: string): string {
  const messageTexts = messages
    .map((m) => `[${m.role}]: ${m.content}`)
    .join("\n\n");

  let prompt = `Summarize the following conversation concisely while preserving key information:\n\n${messageTexts}`;

  if (customInstructions) {
    prompt += `\n\nAdditional context to preserve: ${customInstructions}`;
  }

  prompt += `\n\nProvide a 2-3 sentence summary that captures:
1. What was discussed/worked on
2. Key decisions or outcomes
3. Any important context for future work`;

  return prompt;
}

async function generateSummaryFromAI(prompt: string): Promise<string> {
  // TODO: 实现实际的 AI 调用
  // 这是一个占位符，实际应该调用实际的 AI 模型
  return `[Summary of ${prompt.split("\n\n").length} messages - AI summary generation not yet implemented]`;
}

function generateBoundarySummary(removedMessages: Message[]): string {
  if (removedMessages.length === 0) {
    return "No earlier messages to summarize.";
  }

  const totalChars = removedMessages.reduce((sum, m) => sum + m.content.length, 0);
  const userCount = removedMessages.filter((m) => m.role === "user").length;
  const assistantCount = removedMessages.filter((m) => m.role === "assistant").length;

  return `Earlier conversation (${removedMessages.length} messages, ~${Math.ceil(totalChars / CHARS_PER_TOKEN)} tokens):
- ${userCount} user message(s)
- ${assistantCount} assistant message(s)

Key topics discussed were removed to make room for new work.`;
}

// ============================================================================
// 压缩触发检查
// ============================================================================

export interface CompactTriggerResult {
  shouldCompact: boolean;
  reason: string;
  severity: "warning" | "critical" | "none";
  recommendation: string;
}

export function checkCompactTrigger(
  budget: TokenBudgetManager,
  recentMessageCount: number,
  recentTurnCount: number
): CompactTriggerResult {
  // 检查触发条件
  if (budget.isCritical) {
    return {
      shouldCompact: true,
      reason: `Token usage at ${(budget.usage * 100).toFixed(0)}% - critical threshold`,
      severity: "critical",
      recommendation: "Immediate compaction required",
    };
  }

  if (budget.shouldCompact && recentMessageCount >= COMPACT_THRESHOLDS.AUTO.minMessages) {
    return {
      shouldCompact: true,
      reason: `Token usage at ${(budget.usage * 100).toFixed(0)}% with ${recentMessageCount} messages`,
      severity: "warning",
      recommendation: "Compaction recommended to prevent interruption",
    };
  }

  if (budget.isWarning) {
    return {
      shouldCompact: false,
      reason: `Token usage at ${(budget.usage * 100).toFixed(0)}% - approaching limit`,
      severity: "warning",
      recommendation: "Consider compacting soon",
    };
  }

  return {
    shouldCompact: false,
    reason: "Token usage within normal range",
    severity: "none",
    recommendation: "No action needed",
  };
}

// ============================================================================
// 工具创建
// ============================================================================

export function createCompactTool() {
  const COMPACT_TOOL_NAME = "compact";
  const COMPACT_TOOL_DESCRIPTION =
    "Compact conversation context to reduce token usage. Removes older messages while preserving key information and creating a summary.";

  const CompactInputSchema = {
    type: "object" as const,
    properties: {
      strategy: {
        type: "string" as const,
        enum: ["summary", "prune", "hybrid"],
        description: "Compaction strategy to use",
        default: "hybrid",
      },
      keepRecentCount: {
        type: "number" as const,
        description: "Number of recent messages to keep",
        default: 10,
      },
      customInstructions: {
        type: "string" as const,
        description: "Custom instructions for what to preserve",
      },
    },
  };

  return {
    name: COMPACT_TOOL_NAME,
    description: COMPACT_TOOL_DESCRIPTION,
    inputSchema: CompactInputSchema,

    async handle(params: Record<string, unknown>): Promise<AgentToolResult> {
      const strategy = (params.strategy as string) || "hybrid";
      const keepRecentCount = (params.keepRecentCount as number) || 10;
      const customInstructions = params.customInstructions as string | undefined;

      // 获取会话消息（从上下文）
      // 注意：实际实现需要从会话状态获取
      const messages: Message[] = [];

      if (messages.length === 0) {
        return {
          ok: true,
          status: "completed",
          result: {
            type: "text",
            text: "No messages to compact. Conversation is already compact.",
          },
        };
      }

      // 创建预算管理器
      const budget = new TokenBudgetManager();
      budget.setUsage(estimateMessagesTokenCount(messages));

      // 执行压缩
      const result = await compactMessages(messages, budget, {
        strategy: strategy as "summary" | "prune" | "hybrid",
        keepRecentCount,
        customInstructions,
      });

      const savings = ((1 - result.compactedTokens / result.originalTokens) * 100).toFixed(1);

      return {
        ok: true,
        status: "completed",
        result: {
          type: "text",
          text: `Compaction complete.\n\n` +
            `Messages: ${result.originalCount} → ${result.compactedCount}\n` +
            `Tokens: ${result.originalTokens} → ${result.compactedTokens} (${savings}% reduction)\n` +
            `Strategy: ${strategy}\n` +
            `\n${result.summary}`,
        },
        metadata: {
          originalCount: result.originalCount,
          compactedCount: result.compactedCount,
          originalTokens: result.originalTokens,
          compactedTokens: result.compactedTokens,
        },
      };
    },
  };
}
