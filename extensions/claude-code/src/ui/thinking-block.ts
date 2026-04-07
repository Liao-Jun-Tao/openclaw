/**
 * Claude Code 风格的思考块组件
 * 显示 AI 推理过程
 */

import { Box, Text } from "@mariozechner/pi-tui";

// ============================================================================
// 类型
// ============================================================================

export interface ThinkingBlockProps {
  /** 思考内容 */
  content: string;
  /** 消耗的 Token 数 */
  tokenCount?: number;
  /** 是否折叠 */
  collapsed?: boolean;
  /** 层级 (影响缩进和标记) */
  level?: "compact" | "normal" | "verbose";
  /** 显示 Token 统计 */
  showStats?: boolean;
  /** 动画模式 */
  animated?: boolean;
  /** 当前动画帧 */
  frame?: number;
}

export interface ThinkingLineProps {
  /** 单行思考内容 */
  content: string;
  /** 行号 */
  lineNumber?: number;
  /** 是否是标题/重点行 */
  isHeader?: boolean;
  /** 是否是代码 */
  isCode?: boolean;
}

// ============================================================================
// 常量
// ============================================================================

const THINKING_MARKERS = {
  compact: "🤔",
  normal: "💭",
  verbose: "🧠",
};

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const MAX_PREVIEW_LINES = 10;
const COLLAPSE_THRESHOLD = 20;

// ============================================================================
// 思考块组件
// ============================================================================

/**
 * Claude Code 风格的思考块显示
 * 
 * 示例输出 (verbose 模式):
 * ```
 * 🧠 Thinking... (~2,450 tokens)
 * ─────────────────────────────────
 * Let me analyze this problem...
 * 
 * 1. Understanding the requirements
 *    - User wants to migrate to microservices
 *    - Team has 5 developers
 * 
 * 2. Evaluating options
 *    A. Strangler Fig Pattern
 *       Pros: Incremental migration
 *       Cons: Longer timeline
 * ```
 */
export function ThinkingBlock({
  content,
  tokenCount,
  collapsed = false,
  level = "normal",
  showStats = true,
  animated = false,
  frame,
}: ThinkingBlockProps) {
  const marker = THINKING_MARKERS[level];
  const lines = content.split("\n");
  const isLong = lines.length > COLLAPSE_THRESHOLD;
  
  // 如果是动画模式且正在思考中
  if (animated && !content) {
    return (
      <ThinkingAnimated marker={marker} frame={frame} />
    );
  }

  return (
    <Box flexDirection="column">
      {/* 头部 */}
      <Box alignItems="center" gap={1}>
        <Text bold>{marker}</Text>
        <Text>Thinking</Text>
        {showStats && tokenCount !== undefined && (
          <Text dimColor>(~{formatTokenCount(tokenCount)})</Text>
        )}
      </Box>

      {/* 分隔线 */}
      <Box paddingTop={0}>
        <Text dimColor>{getDivider(level)}</Text>
      </Box>

      {/* 内容 */}
      {collapsed && isLong ? (
        <ThinkingCollapsed content={content} lines={lines.length} />
      ) : (
        <ThinkingContent lines={lines} level={level} />
      )}

      {/* 折叠提示 */}
      {collapsed && isLong && (
        <Box paddingTop={0}>
          <Text dimColor>[{lines.length - MAX_PREVIEW_LINES} more lines]</Text>
        </Box>
      )}
    </Box>
  );
}

// ============================================================================
// 思考内容渲染
// ============================================================================

interface ThinkingContentProps {
  lines: string[];
  level: "compact" | "normal" | "verbose";
}

function ThinkingContent({ lines, level }: ThinkingContentProps) {
  const paddingLeft = level === "verbose" ? 2 : level === "normal" ? 1 : 0;
  const indent = "  ".repeat(paddingLeft);

  return (
    <Box flexDirection="column" paddingTop={0}>
      {lines.map((line, i) => (
        <ThinkingLine
          key={i}
          content={line}
          lineNumber={level === "verbose" ? i + 1 : undefined}
          isHeader={isHeaderLine(line)}
          isCode={isCodeLine(line)}
        />
      ))}
    </Box>
  );
}

// ============================================================================
// 单行思考渲染
// ============================================================================

function ThinkingLine({ content, lineNumber, isHeader, isCode }: ThinkingLineProps) {
  if (!content.trim()) {
    return <Text></Text>;
  }

  return (
    <Box alignItems="flex-start">
      {lineNumber !== undefined && (
        <Text dimColor width={3}>{lineNumber}</Text>
      )}
      <Text
        bold={isHeader}
        dimColor={isCode}
        color={isCode ? "yellow" : undefined}
      >
        {isCode ? `  ${content}` : content}
      </Text>
    </Box>
  );
}

// ============================================================================
// 折叠内容
// ============================================================================

interface ThinkingCollapsedProps {
  content: string;
  lines: number;
}

function ThinkingCollapsed({ content, lines }: ThinkingCollapsedProps) {
  const previewLines = content.split("\n").slice(0, MAX_PREVIEW_LINES);

  return (
    <Box flexDirection="column">
      {previewLines.map((line, i) => (
        <Text key={i} dimColor>{line}</Text>
      ))}
      <Text dimColor>...</Text>
      <Text dimColor>[{lines - MAX_PREVIEW_LINES} more lines hidden]</Text>
    </Box>
  );
}

// ============================================================================
// 动画思考 (思考中)
// ============================================================================

interface ThinkingAnimatedProps {
  marker: string;
  frame?: number;
}

function ThinkingAnimated({ marker, frame }: ThinkingAnimatedProps) {
  const spinner = SPINNER_FRAMES[(frame ?? Math.floor(Date.now() / 100)) % SPINNER_FRAMES.length];

  return (
    <Box alignItems="center" gap={1}>
      <Text color="cyan">{spinner}</Text>
      <Text dimColor>Thinking</Text>
      <Text dimColor>{getThinkingDots(frame)}</Text>
    </Box>
  );
}

// ============================================================================
// 思考摘要 (简洁模式)
// ============================================================================

export interface ThinkingSummaryProps {
  content: string;
  maxLength?: number;
}

export function ThinkingSummary({ content, maxLength = 100 }: ThinkingSummaryProps) {
  const summary = content.length > maxLength 
    ? content.slice(0, maxLength) + "..."
    : content;

  return (
    <Box alignItems="center" gap={1}>
      <Text dimColor>🤔</Text>
      <Text dimColor italic>{summary}</Text>
    </Box>
  );
}

// ============================================================================
// 思考统计
// ============================================================================

export interface ThinkingStatsProps {
  tokenCount: number;
  lineCount: number;
  durationMs?: number;
}

export function ThinkingStats({ tokenCount, lineCount, durationMs }: ThinkingStatsProps) {
  return (
    <Box gap={2}>
      <Text dimColor>~{formatTokenCount(tokenCount)}</Text>
      <Text dimColor>({lineCount} lines)</Text>
      {durationMs !== undefined && (
        <Text dimColor>{formatDuration(durationMs)}</Text>
      )}
    </Box>
  );
}

// ============================================================================
// 辅助函数
// ============================================================================

function getDivider(level: "compact" | "normal" | "verbose"): string {
  const width = level === "verbose" ? 40 : level === "normal" ? 30 : 20;
  return "─".repeat(width);
}

function formatTokenCount(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens} tokens`;
  }
  return `${(tokens / 1000).toFixed(1)}k tokens`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

function isHeaderLine(line: string): boolean {
  return /^\d+\.|^[A-Z][A-Z\s]+:$|^\*\*.*\*\*$/.test(line.trim());
}

function isCodeLine(line: string): boolean {
  return /^[`\s]/.test(line) || line.includes("```");
}

function getThinkingDots(frame?: number): string {
  const dots = (frame ?? Math.floor(Date.now() / 300)) % 4;
  return ".".repeat(dots);
}

// ============================================================================
// 导出
// ============================================================================

export {
  ThinkingBlock,
  ThinkingSummary,
  ThinkingStats,
};
