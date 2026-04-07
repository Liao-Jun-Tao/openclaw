/**
 * Claude Code UI Components for OpenClaw
 *
 * 移植自 Claude Code 的 Ink UI 组件
 */

// Progress Components
export {
  ProgressBar,
  AgentProgress,
  Spinner,
  ToolUseProgress,
  ToolUseList,
  type ProgressBarProps,
  type AgentProgressProps,
  type SpinnerProps,
  type ToolUseProgressProps,
  type ToolUseListProps,
} from "./progress-bar.js";

// Thinking Components
export {
  ThinkingBlock,
  ThinkingSummary,
  ThinkingStats,
  type ThinkingBlockProps,
  type ThinkingLineProps,
  type ThinkingSummaryProps,
  type ThinkingStatsProps,
} from "./thinking-block.js";

// Tool Result Components
export {
  ToolResult,
  ToolResultInline,
  ErrorMessage,
  WarningMessage,
  StatusMessage,
  ToolProgress,
  type ToolResultProps,
  type ErrorMessageProps,
  type StatusMessageProps,
  type ToolProgressProps,
} from "./tool-result.js";
