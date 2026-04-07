/**
 * Claude Code 风格的工具结果和错误显示组件
 */

import { Box, Text } from "@mariozechner/pi-tui";

// ============================================================================
// 类型
// ============================================================================

export interface ToolResultProps {
  /** 工具名称 */
  toolName: string;
  /** 是否成功 */
  ok: boolean;
  /** 输出内容 */
  output?: string;
  /** 错误信息 */
  error?: string;
  /** 执行时长 (毫秒) */
  duration?: number;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 边框颜色 */
  borderColor?: "green" | "red" | "yellow" | "cyan";
}

export interface ErrorMessageProps {
  /** 错误信息 */
  message: string;
  /** 错误类型 */
  type?: "error" | "warning" | "info";
  /** 是否显示建议 */
  showSuggestion?: boolean;
  /** 建议内容 */
  suggestion?: string;
}

export interface StatusMessageProps {
  /** 消息内容 */
  message: string;
  /** 消息类型 */
  type?: "success" | "info" | "warning" | "error";
  /** 图标 */
  icon?: string;
  /** 是否带时间戳 */
  timestamp?: boolean;
}

// ============================================================================
// 常量
// ============================================================================

const ICONS = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
  tool: "🔧",
  bash: "💻",
  file: "📄",
  edit: "✏️",
  search: "🔍",
};

// ============================================================================
// 工具结果组件
// ============================================================================

/**
 * Claude Code 风格的工具结果展示
 * 
 * 示例输出:
 * ```
 * ┌─ ✅ bash ─────────────── 245ms ─┐
 * │ $ git status                    │
 * │ On branch main                 │
 * │ Changes not staged for commit:  │
 * └─────────────────────────────────┘
 * ```
 */
export function ToolResult({
  toolName,
  ok,
  output,
  error,
  duration,
  bordered = true,
  borderColor,
}: ToolResultProps) {
  const status = ok ? "success" : "error";
  const color = borderColor || (ok ? "green" : "red");
  const icon = ICONS[ok ? "success" : "error"];

  // 计算工具图标
  const toolIcon = getToolIcon(toolName);

  // 如果没有输出，只显示头部
  if (!output && !error) {
    return (
      <Box alignItems="center" gap={1}>
        <Text color={color}>{icon}</Text>
        <Text bold>{toolName}</Text>
        {duration !== undefined && (
          <Text dimColor>({duration}ms)</Text>
        )}
      </Box>
    );
  }

  if (!bordered) {
    return (
      <Box flexDirection="column">
        <Box alignItems="center" gap={1}>
          <Text color={color}>{icon}</Text>
          <Text bold>{toolName}</Text>
          {duration !== undefined && (
            <Text dimColor>({duration}ms)</Text>
          )}
        </Box>
        {output && (
          <Box paddingLeft={2} flexDirection="column">
            <Text>{output}</Text>
          </Box>
        )}
        {error && (
          <Box paddingLeft={2}>
            <Text color="red">{error}</Text>
          </Box>
        )}
      </Box>
    );
  }

  // 带边框的输出
  const content = output || error || "";
  const lines = content.split("\n");
  const maxWidth = Math.min(getMaxLineWidth(lines), 60);
  const paddedLines = padLines(lines, maxWidth);

  return (
    <Box flexDirection="column">
      {/* 头部 */}
      <Box>
        <Text color={color}>┌─</Text>
        <Text color={color}>{icon}</Text>
        <Text bold> {toolName}</Text>
        <Text dimColor>{" "}{"─".repeat(Math.max(0, maxWidth - toolName.length - 2))}</Text>
        {duration !== undefined && (
          <Text dimColor>{duration}ms</Text>
        )}
        <Text color={color}>─</Text>
        <Text color={color}>┐</Text>
      </Box>

      {/* 内容 */}
      {paddedLines.map((line, i) => (
        <Box key={i}>
          <Text color={color}>│</Text>
          <Text>{line || " "}</Text>
        </Box>
      ))}

      {/* 尾部 */}
      <Box>
        <Text color={color}>└</Text>
        <Text color={color}>{"─".repeat(maxWidth + 2)}</Text>
        <Text color={color}>┘</Text>
      </Box>
    </Box>
  );
}

// ============================================================================
// 简洁工具结果
// ============================================================================

/**
 * 单行工具结果 (无边框)
 */
export function ToolResultInline({
  toolName,
  ok,
  output,
  error,
  duration,
}: Omit<ToolResultProps, "bordered">) {
  const icon = ok ? "✅" : "❌";
  const color = ok ? "green" : "red";

  return (
    <Box alignItems="center" gap={1}>
      <Text color={color}>{icon}</Text>
      <Text bold>{toolName}</Text>
      {output && <Text dimColor>: {output.slice(0, 50)}</Text>}
      {error && <Text color="red">{error.slice(0, 50)}</Text>}
      {duration !== undefined && (
        <Text dimColor>({duration}ms)</Text>
      )}
    </Box>
  );
}

// ============================================================================
// 错误消息组件
// ============================================================================

/**
 * Claude Code 风格的错误消息
 * 
 * 示例输出:
 * ```
 * ❌ Error: File not found
 * 
 * The file "/path/to/file" does not exist.
 * 
 * 💡 Suggestion: Check if the file path is correct
 * ```
 */
export function ErrorMessage({
  message,
  type = "error",
  showSuggestion = true,
  suggestion,
}: ErrorMessageProps) {
  const icon = ICONS[type];
  const color = type === "error" ? "red" : type === "warning" ? "yellow" : "cyan";

  return (
    <Box flexDirection="column" gap={0}>
      <Box alignItems="center" gap={1}>
        <Text color={color}>{icon}</Text>
        <Text bold color={color}>{type.charAt(0).toUpperCase() + type.slice(1)}:</Text>
        <Text>{message}</Text>
      </Box>
      {showSuggestion && suggestion && (
        <Box alignItems="center" gap={1} paddingTop={0}>
          <Text dimColor>💡 Suggestion:</Text>
          <Text>{suggestion}</Text>
        </Box>
      )}
    </Box>
  );
}

// ============================================================================
// 警告消息组件
// ============================================================================

/**
 * 警告消息 (无边框)
 */
export function WarningMessage({ message }: { message: string }) {
  return (
    <Box alignItems="center" gap={1}>
      <Text color="yellow">⚠️</Text>
      <Text color="yellow">{message}</Text>
    </Box>
  );
}

// ============================================================================
// 状态消息组件
// ============================================================================

/**
 * 状态消息 (带图标和时间戳)
 */
export function StatusMessage({
  message,
  type = "info",
  icon,
  timestamp = false,
}: StatusMessageProps) {
  const statusIcon = icon || ICONS[type];
  const color = type === "success" ? "green" : type === "error" ? "red" : type === "warning" ? "yellow" : "cyan";
  const time = timestamp ? formatTimestamp(Date.now()) : null;

  return (
    <Box alignItems="center" gap={1}>
      <Text color={color}>{statusIcon}</Text>
      <Text>{message}</Text>
      {time && <Text dimColor>({time})</Text>}
    </Box>
  );
}

// ============================================================================
// 工具进度组件
// ============================================================================

export interface ToolProgressProps {
  toolName: string;
  currentStep?: string;
  totalSteps?: number;
  progress?: number; // 0-100
}

/**
 * 工具执行进度
 */
export function ToolProgress({
  toolName,
  currentStep,
  totalSteps,
  progress,
}: ToolProgressProps) {
  const icon = getToolIcon(toolName);

  return (
    <Box flexDirection="column" gap={0}>
      <Box alignItems="center" gap={1}>
        <Text dimColor>{icon}</Text>
        <Text>{toolName}</Text>
        {totalSteps !== undefined && (
          <Text dimColor>({currentStep || 0}/{totalSteps})</Text>
        )}
      </Box>
      {progress !== undefined && (
        <ProgressMini value={progress} />
      )}
      {currentStep && (
        <Box paddingLeft={3}>
          <Text dimColor>{currentStep}</Text>
        </Box>
      )}
    </Box>
  );
}

function ProgressMini({ value }: { value: number }) {
  const width = 20;
  const filled = Math.round((value / 100) * width);
  const empty = width - filled;

  return (
    <Box paddingLeft={3}>
      <Text dimColor>[</Text>
      <Text color="cyan">{"█".repeat(filled)}</Text>
      <Text dimColor>{"░".repeat(empty)}</Text>
      <Text dimColor>]</Text>
    </Box>
  );
}

// ============================================================================
// 辅助函数
// ============================================================================

function getToolIcon(toolName: string): string {
  const name = toolName.toLowerCase();
  if (name.includes("bash") || name.includes("shell") || name.includes("exec")) return ICONS.bash;
  if (name.includes("read") || name.includes("file")) return ICONS.file;
  if (name.includes("edit") || name.includes("write")) return ICONS.edit;
  if (name.includes("search") || name.includes("grep") || name.includes("find")) return ICONS.search;
  return ICONS.tool;
}

function getMaxLineWidth(lines: string[]): number {
  return Math.max(...lines.map((line) => line.length), 0);
}

function padLines(lines: string[], maxWidth: number): string[] {
  return lines.map((line) => {
    if (line.length < maxWidth) {
      return line + " ".repeat(maxWidth - line.length);
    }
    return line.slice(0, maxWidth);
  });
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ============================================================================
// 导出
// ============================================================================

export {
  ToolResult,
  ToolResultInline,
  ErrorMessage,
  WarningMessage,
  StatusMessage,
  ToolProgress,
};
