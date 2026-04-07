# Claude Code Ink UI → OpenClaw TUI 移植计划

## 架构对比

| 方面         | Claude Code (Ink) | OpenClaw (pi-tui)            |
| ------------ | ----------------- | ---------------------------- |
| **框架**     | React for CLI     | @mariozechner/pi-tui         |
| **核心组件** | Box, Text, Spacer | Box, Container, Text, Spacer |
| **布局**     | Flexbox           | Flexbox                      |
| **主题**     | ThemeProvider     | ThemeContext                 |
| **入口**     | render()          | render()                     |

## 组件映射

### Claude Code Ink → OpenClaw TUI

| Claude Code     | OpenClaw       | 说明          |
| --------------- | -------------- | ------------- |
| `<Box>`         | `Box`          | 容器          |
| `<Text>`        | `Text`         | 文本          |
| `<Spacer>`      | `Spacer`       | 空白          |
| `<Spinner>`     | 自定义         | 加载动画      |
| `<ProgressBar>` | `ProgressLine` | 进度条        |
| `<Markdown>`    | `Markdown`     | Markdown 渲染 |

## 需要移植的核心组件

### 1. 进度显示 (Priority: High)

```
Claude Code:
├── AgentProgressLine.tsx    # Agent 进度行
├── AgentProgressBar.tsx     # 进度条
└── BashModeProgress.tsx     # Bash 模式进度

OpenClaw:
└── src/terminal/progress-line.ts  ← 已有，需增强
```

### 2. 思考显示 (Priority: High)

```
Claude Code:
├── ThinkingBlock.tsx        # 思考块
└── DynamicThinkingBlock.tsx # 动态思考

OpenClaw:
└── extensions/claude-code/src/thinking.ts ← 已实现逻辑
```

### 3. 工具结果 (Priority: Medium)

```
Claude Code:
├── ToolUseResult.tsx
├── FallbackToolUseErrorMessage.tsx
└── ToolProgress.tsx

OpenClaw:
└── src/tui/components/tool-execution.ts ← 已部分实现
```

### 4. 消息显示 (Priority: Medium)

```
Claude Code:
├── Message.tsx
├── MessageResponse.tsx
└── MessageInput.tsx

OpenClaw:
└── src/tui/components/assistant-message.ts
```

## 移植步骤

### Phase 1: 核心组件 (1-2 小时)

1. **ProgressBar 进度条**
   - Claude Code: `AgentProgressLine.tsx`
   - 移植到: `extensions/claude-code/src/ui/progress-bar.ts`

2. **ThinkingBlock 思考块**
   - Claude Code: `ThinkingBlock.tsx`
   - 移植到: `extensions/claude-code/src/ui/thinking-block.ts`

3. **Spinner 加载动画**
   - Claude Code: Ink 内置
   - 移植到: `extensions/claude-code/src/ui/spinner.ts`

### Phase 2: 工具组件 (2-3 小时)

4. **ToolResult 工具结果**
   - Claude Code: `ToolUseResult.tsx`
   - 移植到: `extensions/claude-code/src/ui/tool-result.ts`

5. **ErrorMessage 错误消息**
   - Claude Code: `FallbackToolUseErrorMessage.tsx`
   - 移植到: `extensions/claude-code/src/ui/error-message.ts`

### Phase 3: 集成 (1-2 小时)

6. **UI 组件桶导出**
   - 创建: `extensions/claude-code/src/ui/index.ts`

7. **集成到工具**
   - 更新 bash-tool.ts, file-edit-tool.ts 等使用 UI 组件

## 组件实现模板

### 进度条示例

```typescript
// extensions/claude-code/src/ui/progress-bar.ts

import { Box, Text } from "@mariozechner/pi-tui";

interface ProgressBarProps {
  value: number;        // 0-100
  label?: string;
  width?: number;
  color?: string;
}

// Claude Code 的进度条风格
export function ProgressBar({
  value,
  label,
  width = 30,
  color = "cyan"
}: ProgressBarProps) {
  const filled = Math.round((value / 100) * width);
  const empty = width - filled;

  return (
    <Box flexDirection="column">
      {label && <Text dimColor>{label}</Text>}
      <Box>
        <Text color={color}>
          {"█".repeat(filled)}
        </Text>
        <Text dimColor>
          {"░".repeat(empty)}
        </Text>
        <Text dimColor> {value.toFixed(0)}%</Text>
      </Box>
    </Box>
  );
}
```

### 思考块示例

```typescript
// extensions/claude-code/src/ui/thinking-block.ts

import { Box, Text, Collapsible } from "@mariozechner/pi-tui";

interface ThinkingBlockProps {
  content: string;
  tokenCount: number;
  collapsed?: boolean;
}

export function ThinkingBlock({
  content,
  tokenCount,
  collapsed = false
}: ThinkingBlockProps) {
  return (
    <Collapsible
      collapsed={collapsed}
      header={
        <Box>
          <Text dimColor>🤔 Thinking...</Text>
          <Text dimColor> (~{tokenCount} tokens)</Text>
        </Box>
      }
    >
      <Box paddingLeft={2} flexDirection="column">
        {content.split("\n").map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </Box>
    </Collapsible>
  );
}
```

### 工具结果示例

```typescript
// extensions/claude-code/src/ui/tool-result.ts

import { Box, Text } from "@mariozechner/pi-tui";

interface ToolResultProps {
  toolName: string;
  ok: boolean;
  output?: string;
  error?: string;
  duration?: number;
}

export function ToolResult({
  toolName,
  ok,
  output,
  error,
  duration
}: ToolResultProps) {
  const borderColor = ok ? "green" : "red";
  const statusIcon = ok ? "✅" : "❌";

  return (
    <Box flexDirection="column" borderColor={borderColor}>
      <Box justifyContent="space-between">
        <Text bold>{statusIcon} {toolName}</Text>
        {duration && (
          <Text dimColor>{duration}ms</Text>
        )}
      </Box>
      {output && (
        <Box paddingLeft={2}>
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
```

## 目录结构

```
extensions/claude-code/
└── src/
    └── ui/
        ├── index.ts              # 导出所有 UI 组件
        ├── progress-bar.ts       # 进度条
        ├── thinking-block.ts     # 思考块
        ├── spinner.ts            # 加载动画
        ├── tool-result.ts       # 工具结果
        ├── error-message.ts     # 错误消息
        ├── status-message.ts    # 状态消息
        └── markdown-renderer.ts # Markdown 渲染
```

## 依赖

```typescript
// 需要确保 @mariozechner/pi-tui 可用
import { Box, Text, Spacer, Collapsible, Markdown } from "@mariozechner/pi-tui";
```

## 实施顺序

1. ✅ 已有 `src/terminal/progress-line.ts` (OpenClaw 原生)
2. 🔄 创建 `src/ui/progress-bar.ts` (Claude Code 风格)
3. 🔄 创建 `src/ui/thinking-block.ts`
4. 🔄 创建 `src/ui/spinner.ts`
5. 🔄 创建 `src/ui/tool-result.ts`
6. 🔄 更新工具使用 UI 组件
7. 🔄 测试集成
