/**
 * Claude Code 风格的思考系统
 * 基于 Claude Code CLI 的 thinking.ts 和 thinking block 设计
 */

import type { AgentToolResult } from "@mariozechner/pi-agent-core";

// ============================================================================
// 常量
// ============================================================================

const THINKING_CONFIG = {
  off: { maxTokens: 0, enabled: false },
  low: { maxTokens: 2000, enabled: true },
  medium: { maxTokens: 8000, enabled: true },
  high: { maxTokens: 15000, enabled: true },
  ultra: { maxTokens: 30000, enabled: true },
} as const;

type ThinkingLevel = keyof typeof THINKING_CONFIG;

// ============================================================================
// 类型
// ============================================================================

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
  thinking_loc: {
    input_tokens: number;
  };
  signature?: string;
}

export interface ThinkingConfig {
  level: ThinkingLevel;
  maxTokens: number;
  enabled: boolean;
}

export interface ThinkingState {
  isThinking: boolean;
  content: string;
  tokenCount: number;
  level: ThinkingLevel;
  startTime: number;
}

// ============================================================================
// 思考管理器
// ============================================================================

export class ThinkingManager {
  private state: ThinkingState = {
    isThinking: false,
    content: "",
    tokenCount: 0,
    level: "medium",
    startTime: 0,
  };

  private listeners: Set<(state: ThinkingState) => void> = new Set();

  // 获取当前配置
  getConfig(level: ThinkingLevel = "medium"): ThinkingConfig {
    return {
      level,
      ...THINKING_CONFIG[level],
    };
  }

  // 开始思考
  startThinking(level: ThinkingLevel = "medium"): void {
    this.state = {
      isThinking: true,
      content: "",
      tokenCount: 0,
      level,
      startTime: Date.now(),
    };
    this.notifyListeners();
  }

  // 更新思考内容 (流式)
  updateThinking(chunk: string, tokenCount?: number): void {
    if (!this.state.isThinking) return;

    this.state.content += chunk;
    if (tokenCount !== undefined) {
      this.state.tokenCount = tokenCount;
    }
    this.notifyListeners();
  }

  // 结束思考
  endThinking(): ThinkingBlock | null {
    if (!this.state.isThinking) return null;

    const block: ThinkingBlock = {
      type: "thinking",
      thinking: this.state.content,
      thinking_loc: {
        input_tokens: this.state.tokenCount,
      },
    };

    this.state.isThinking = false;
    this.notifyListeners();

    return block;
  }

  // 获取当前状态
  getState(): ThinkingState {
    return { ...this.state };
  }

  // 订阅状态变化
  subscribe(listener: (state: ThinkingState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  // 检查是否支持思考
  static supportsThinking(model?: string): boolean {
    // Claude 4+ 支持思考
    // OpenClaw 可以根据模型判断
    if (!model) return true;
    return model.includes("claude-4") || model.includes("sonnet-4") || model.includes("opus-4");
  }
}

// ============================================================================
// 思考格式化
// ============================================================================

export interface ThinkingFormatOptions {
  showTokens?: boolean;
  showDuration?: boolean;
  collapseThreshold?: number;
  syntaxHighlight?: boolean;
}

export function formatThinkingForDisplay(
  thinking: string,
  options: ThinkingFormatOptions = {}
): string {
  const {
    showTokens = false,
    showDuration = false,
    collapseThreshold = 20,
    syntaxHighlight = false,
  } = options;

  const lines = thinking.split("\n");
  let output = "";

  // 思考开始标记
  output += "🤔 Thinking...\n\n";

  // 思考内容
  if (lines.length <= collapseThreshold) {
    output += formatThinkingContent(thinking, syntaxHighlight);
  } else {
    // 折叠长思考
    output += formatThinkingContent(lines.slice(0, collapseThreshold).join("\n"), syntaxHighlight);
    output += `\n\n... [${lines.length - collapseThreshold} more lines]`;
  }

  // 元信息
  const meta: string[] = [];
  if (showTokens) {
    meta.push(`~${Math.ceil(thinking.length / 4)} tokens`);
  }
  if (showDuration) {
    meta.push(`${((Date.now() - Date.now()) / 1000).toFixed(1)}s`);
  }
  if (meta.length > 0) {
    output += `\n\n(${meta.join(" | ")})`;
  }

  return output;
}

function formatThinkingContent(content: string, highlight: boolean): string {
  if (!highlight) return content;

  // 简单的语法高亮
  return content
    .replace(/\*\*([^*]+)\*\*/g, "\x1b[1m$1\x1b[0m") // 粗体
    .replace(/`([^`]+)`/g, "\x1b[33m$1\x1b[0m") // 代码
    .replace(/^#{1,3}\s+(.+)$/gm, "\x1b[36m$&\x1b[0m"); // 标题
}

// ============================================================================
// 思考工具
// ============================================================================

export function createThinkingTool() {
  const THINKING_TOOL_NAME = "think";
  const THINKING_TOOL_DESCRIPTION =
    "Enable or manage thinking mode. Shows the AI's reasoning process for complex tasks.";

  const ThinkingInputSchema = {
    type: "object" as const,
    properties: {
      action: {
        type: "string" as const,
        enum: ["show", "hide", "enable", "disable", "status"],
        description: "Action to perform",
        default: "status",
      },
      level: {
        type: "string" as const,
        enum: ["off", "low", "medium", "high", "ultra"],
        description: "Thinking level",
        default: "medium",
      },
      question: {
        type: "string",
        description: "Question or topic to think about",
      },
    },
  };

  // 全局思考管理器
  const globalThinkingManager = new ThinkingManager();

  return {
    name: THINKING_TOOL_NAME,
    description: THINKING_TOOL_DESCRIPTION,
    inputSchema: ThinkingInputSchema,

    async handle(params: Record<string, unknown>): Promise<AgentToolResult> {
      const action = (params.action as string) || "status";
      const level = (params.level as ThinkingLevel) || "medium";
      const question = params.question as string | undefined;

      switch (action) {
        case "enable":
          globalThinkingManager.startThinking(level);
          return {
            ok: true,
            status: "completed",
            result: {
              type: "text",
              text: `Thinking enabled at ${level} level.\n\nUse /think show to see reasoning process.`,
            },
          };

        case "disable":
          globalThinkingManager.endThinking();
          return {
            ok: true,
            status: "completed",
            result: {
              type: "text",
              text: "Thinking disabled.",
            },
          };

        case "show": {
          const state = globalThinkingManager.getState();
          if (!state.isThinking && !state.content) {
            return {
              ok: true,
              status: "completed",
              result: {
                type: "text",
                text: "No active thinking. Use /think enable first.",
              },
            };
          }

          const formatted = formatThinkingForDisplay(state.content, {
            showTokens: true,
            showDuration: true,
          });

          return {
            ok: true,
            status: "completed",
            result: {
              type: "text",
              text: formatted,
            },
          };
        }

        case "status": {
          const state = globalThinkingManager.getState();
          const supportsThinking = ThinkingManager.supportsThinking();

          if (!supportsThinking) {
            return {
              ok: true,
              status: "completed",
              result: {
                type: "text",
                text: "Thinking: Not supported by current model.\n\nTip: Use Claude 4+ models for thinking support.",
              },
            };
          }

          if (state.isThinking) {
            return {
              ok: true,
              status: "completed",
              result: {
                type: "text",
                text: `Thinking: Active (${state.level})\nTokens: ~${state.tokenCount}\nContent preview: ${state.content.slice(0, 100)}...`,
              },
            };
          }

          return {
            ok: true,
            status: "completed",
            result: {
              type: "text",
              text: `Thinking: Disabled\nLevel: ${level}\n\nUse /think enable to start thinking.`,
            },
          };
        }

        default:
          return {
            ok: false,
            status: "failed",
            result: {
              type: "text",
              text: `Unknown action: ${action}`,
            },
          };
      }
    },
  };
}

// ============================================================================
// API 思考配置
// ============================================================================

export interface ApiThinkingConfig {
  /**
   * Maximum tokens to use for thinking.
   * 0 = thinking disabled.
   */
  maxTokens: number;

  /**
   * Whether to include thinking blocks in the response.
   */
  includeThoughts: boolean;

  /**
   * Budget tokens for thinking (internal).
   */
  thinkingBudget?: number;
}

/**
 * Build thinking configuration for API calls
 */
export function buildThinkingConfig(
  level: ThinkingLevel,
  model?: string
): ApiThinkingConfig | undefined {
  // 检查模型是否支持
  if (!ThinkingManager.supportsThinking(model)) {
    return undefined;
  }

  const config = THINKING_CONFIG[level];
  if (!config.enabled) {
    return { maxTokens: 0, includeThoughts: false };
  }

  return {
    maxTokens: config.maxTokens,
    includeThoughts: true,
  };
}

/**
 * Parse thinking blocks from API response
 */
export function parseThinkingBlocks(
  content: Array<{ type: string; thinking?: string; thinking_loc?: { input_tokens: number } }>
): ThinkingBlock[] {
  return content
    .filter((block) => block.type === "thinking" && block.thinking)
    .map((block) => ({
      type: "thinking" as const,
      thinking: block.thinking || "",
      thinking_loc: block.thinking_loc || { input_tokens: 0 },
    }));
}

// ============================================================================
// 导出
// ============================================================================

export {
  ThinkingManager,
  formatThinkingForDisplay,
  buildThinkingConfig,
  parseThinkingBlocks,
};
