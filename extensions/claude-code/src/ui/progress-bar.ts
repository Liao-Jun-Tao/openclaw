/**
 * Claude Code 风格的进度条组件
 * 基于 Claude Code AgentProgressLine.tsx 和 AgentProgressBar.tsx
 */

import { Box, Text } from "@mariozechner/pi-tui";

// ============================================================================
// 类型
// ============================================================================

export interface ProgressBarProps {
  /** 进度值 0-100 */
  value: number;
  /** 标签文字 */
  label?: string;
  /** 进度条宽度（字符数） */
  width?: number;
  /** 颜色 */
  color?: "green" | "cyan" | "yellow" | "red" | "magenta";
  /** 是否显示百分比 */
  showPercent?: boolean;
  /** 是否显示加载动画 */
  animated?: boolean;
}

export interface AgentProgressProps {
  /** Agent 名称 */
  agentName?: string;
  /** 进度 0-100 */
  progress: number;
  /** 当前操作描述 */
  currentAction?: string;
  /** 工具使用次数 */
  toolUseCount?: number;
  /** Token 数量 */
  tokenCount?: number;
  /** 动画帧索引 */
  frame?: number;
}

// ============================================================================
// 常量
// ============================================================================

const PROGRESS_BLOCK = "█";
const PROGRESS_EMPTY = "░";
const PROGRESS_COLORS = {
  green: "green",
  cyan: "cyan",
  yellow: "yellow",
  red: "red",
  magenta: "magenta",
} as const;

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

// ============================================================================
// 进度条组件
// ============================================================================

/**
 * Claude Code 风格的进度条
 * 
 * 示例输出:
 * ```
 * Processing files...  ████████████░░░░░░░░  60%
 * ```
 */
export function ProgressBar({
  value,
  label,
  width = 30,
  color = "cyan",
  showPercent = true,
  animated = false,
}: ProgressBarProps) {
  // 限制值在 0-100
  const clampedValue = Math.max(0, Math.min(100, value));
  
  // 计算填充和空白
  const filled = Math.round((clampedValue / 100) * width);
  const empty = width - filled;

  // 进度条
  const bar = `${PROGRESS_BLOCK.repeat(filled)}${PROGRESS_EMPTY.repeat(empty)}`;

  // 百分比
  const percent = showPercent ? ` ${clampedValue.toFixed(0)}%` : "";

  return (
    <Box flexDirection="column" gap={0}>
      {label && (
        <Box>
          {animated && <SpinnerFrame frame={Math.floor(Date.now() / 100) % 10} />}
          <Text dimColor>{label}</Text>
        </Box>
      )}
      <Box>
        <Text color={PROGRESS_COLORS[color]}>{bar}</Text>
        {showPercent && <Text dimColor>{percent}</Text>}
      </Box>
    </Box>
  );
}

// ============================================================================
// Agent 进度组件
// ============================================================================

/**
 * Claude Code 风格的 Agent 进度显示
 * 
 * 示例输出:
 * ```
 * ⠋ Agent thinking...           ████████░░░░░░░░░░  40%
 *   Tool: Edit file (3x)
 *   Tokens: 12,345
 * ```
 */
export function AgentProgress({
  agentName,
  progress,
  currentAction,
  toolUseCount,
  tokenCount,
  frame,
}: AgentProgressProps) {
  const spinner = SPINNER_FRAMES[(frame ?? Math.floor(Date.now() / 100)) % SPINNER_FRAMES.length];
  const name = agentName || "Agent";

  return (
    <Box flexDirection="column" gap={0} paddingLeft={0}>
      {/* Agent 名称和进度 */}
      <Box alignItems="center">
        <Text dimColor>{spinner} </Text>
        <Text>{name}</Text>
        <Text dimColor> {currentAction || "working..."}</Text>
      </Box>

      {/* 进度条 */}
      <Box paddingLeft={3}>
        <ProgressBar value={progress} width={25} color="cyan" />
      </Box>

      {/* 统计信息 */}
      {(toolUseCount !== undefined || tokenCount !== undefined) && (
        <Box flexDirection="column" paddingLeft={3} gap={0}>
          {toolUseCount !== undefined && (
            <Text dimColor>
              {"  "}Tools: {toolUseCount}x
            </Text>
          )}
          {tokenCount !== undefined && (
            <Text dimColor>
              {"  "}Tokens: {tokenCount.toLocaleString()}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}

// ============================================================================
// Spinner 组件
// ============================================================================

export interface SpinnerProps {
  /** 动画帧索引 */
  frame?: number;
  /** 颜色 */
  color?: "green" | "cyan" | "yellow" | "red" | "magenta";
  /** 标签 */
  label?: string;
}

/**
 * 加载动画 Spinner
 * 
 * 示例输出:
 * ```
 * ⠋ Loading...
 * ```
 */
export function Spinner({ frame, color = "cyan", label }: SpinnerProps) {
  const spinner = SPINNER_FRAMES[(frame ?? Math.floor(Date.now() / 100)) % SPINNER_FRAMES.length];

  return (
    <Box alignItems="center">
      <Text color={color}>{spinner}</Text>
      {label && <Text> {label}</Text>}
    </Box>
  );
}

// ============================================================================
// 辅助组件
// ============================================================================

function SpinnerFrame({ frame }: { frame: number }) {
  return <Text dimColor>{SPINNER_FRAMES[frame % SPINNER_FRAMES.length]} </Text>;
}

// ============================================================================
// 工具使用进度
// ============================================================================

export interface ToolUseProgressProps {
  toolName: string;
  status: "running" | "success" | "error";
  duration?: number;
  frame?: number;
}

/**
 * 单个工具使用的进度显示
 */
export function ToolUseProgress({
  toolName,
  status,
  duration,
  frame,
}: ToolUseProgressProps) {
  const icons = {
    running: SPINNER_FRAMES[(frame ?? Math.floor(Date.now() / 100)) % SPINNER_FRAMES.length],
    success: "✅",
    error: "❌",
  };

  const colors = {
    running: "cyan" as const,
    success: "green" as const,
    error: "red" as const,
  };

  return (
    <Box alignItems="center">
      <Text color={colors[status]}>{icons[status]}</Text>
      <Text> {toolName}</Text>
      {duration !== undefined && (
        <Text dimColor> ({duration}ms)</Text>
      )}
    </Box>
  );
}

// ============================================================================
// 多工具使用列表
// ============================================================================

export interface ToolUseListProps {
  tools: Array<{
    name: string;
    count: number;
    lastDuration?: number;
  }>;
  maxDisplay?: number;
}

/**
 * 工具使用列表
 */
export function ToolUseList({ tools, maxDisplay = 5 }: ToolUseListProps) {
  const displayTools = tools.slice(0, maxDisplay);
  const remaining = tools.length - maxDisplay;

  return (
    <Box flexDirection="column" gap={0}>
      {displayTools.map((tool, i) => (
        <Box key={i} alignItems="center">
          <Text dimColor>  • </Text>
          <Text>{tool.name}</Text>
          {tool.count > 1 && (
            <Text dimColor> ({tool.count}x)</Text>
          )}
          {tool.lastDuration !== undefined && (
            <Text dimColor> ~{tool.lastDuration}ms</Text>
          )}
        </Box>
      ))}
      {remaining > 0 && (
        <Text dimColor>  ... and {remaining} more</Text>
      )}
    </Box>
  );
}

// ============================================================================
// 导出
// ============================================================================

export {
  ProgressBar,
  AgentProgress,
  Spinner,
  ToolUseProgress,
  ToolUseList,
};
