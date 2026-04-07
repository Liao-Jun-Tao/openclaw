# Claude Code 源码深度分析

> 基于 `/Users/liaojuntao/01_Projects/Personal/claude-code-cli` 源码

## 1. 核心架构

```
Claude Code CLI
├── commands/           # 斜杠命令 (/commit, /review, etc)
├── tools/             # 工具系统 (AgentTool, BashTool, etc)
├── tasks/             # 任务执行 (LocalAgentTask, LocalShellTask)
├── services/
│   ├── compact/       # 上下文压缩系统
│   └── analytics/      # 分析服务
├── hooks/             # React hooks
├── components/        # Ink UI 组件
├── state/             # 状态管理
└── query.ts           # 核心查询引擎 (2188行)
```

## 2. 工具系统 (Tools)

### 2.1 工具基类 (Tool.ts)

```typescript
// 每个工具的核心接口
interface Tool {
  name: string              // 工具名称
  inputSchema: Schema       // 输入参数 Schema
  outputSchema?: Schema     // 输出 Schema
  
  // 核心方法
  description(): string
  prompt?(): string         // 工具使用提示
  userFacingName(): string
  getToolUseSummary(input)  // 工具使用摘要
  
  // 执行
  async handle(params, context): Promise<AgentToolResult>
}
```

### 2.2 工具注册表 (tools.ts)

```typescript
// 集中注册所有工具
const tools = [
  AgentTool,           // Agent 嵌套执行
  BashTool,            // Shell 命令
  FileEditTool,        // 文件编辑
  FileReadTool,        // 文件读取
  GlobTool,            // Glob 匹配
  GrepTool,            // 搜索
  WebSearchTool,       // 网页搜索
  TaskTool,           // 任务管理
  // ... 30+ 工具
]
```

### 2.3 权限系统 (bashPermissions.ts)

```typescript
// 安全命令白名单
const ALLOWED_COMMANDS = [
  'git add:*',
  'git commit:*',
  'git status:*',
  'git diff:*',
]

// 危险命令黑名单
const DENY_LISTED = new Set([
  ':', 'alias', 'bind', 'builtin', 'eval', 
  'exec', 'source', 'set', 'unset'
])
```

## 3. Agent 系统

### 3.1 AgentTool (tools/AgentTool/)

**功能**: 在子 Agent 中执行任务

```typescript
// 输入 Schema
const AgentToolInput = {
  taskDescription: string,    // 任务描述
  agentType: string,          // Agent 类型
  model?: string,             // 模型选择
  maxTokens?: number,         // 最大 Token
  systemPrompt?: string,       // 系统提示
}
```

**关键特性**:
- 支持模型选择
- Token 预算控制
- 嵌套 Agent 执行
- 进度追踪

### 3.2 LocalAgentTask (tasks/LocalAgentTask/)

**状态机**:
```typescript
type LocalAgentTaskState = {
  type: 'local_agent'
  agentId: string
  prompt: string
  model?: string
  abortController?: AbortController
  progress?: AgentProgress
  isBackgrounded: boolean
  retain: boolean
  diskLoaded: boolean
}
```

**进度追踪**:
```typescript
type ProgressTracker = {
  toolUseCount: number
  latestInputTokens: number
  cumulativeOutputTokens: number
  recentActivities: ToolActivity[]
}
```

## 4. 查询引擎 (Query Engine)

### 4.1 query.ts (2188 行)

**核心流程**:
```
用户消息
    ↓
构建提示词 (Build Prompt)
    ↓
流式执行 (Stream Execute)
    ↓
解析结果 (Parse Result)
    ↓
执行工具 (Execute Tools)
    ↓
循环 (Loop) 或 返回结果
```

**关键组件**:
- `buildSystemPrompt()` - 构建系统提示
- `buildMessages()` - 构建消息历史
- `executeTools()` - 执行工具
- `loop()` - 主循环

### 4.2 工具执行循环

```typescript
async function toolLoop(state: AppState) {
  while (true) {
    // 1. 发送消息给模型
    const response = await model.generate(messages)
    
    // 2. 处理响应
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        // 3. 执行工具
        const result = await executeTool(block.name, block.input)
        messages.push(toolResult)
      } else if (block.type === 'text') {
        // 输出文本
        display(block.text)
      }
    }
    
    // 4. 检查终止条件
    if (response.stopReason === 'end_turn') break
  }
}
```

## 5. 上下文管理

### 5.1 压缩系统 (services/compact/)

```typescript
// 自动压缩触发条件
const COMPACT_TRIGGERS = {
  minTurns: 6,
  minMessages: 10,
  tokenThreshold: 0.85  // 85% context usage
}

// 压缩策略
const COMPACT_STRATEGIES = [
  'microcompact',   // 最小压缩
  'autoCompact',    // 自动压缩
  'snip',           // 掐头去尾
]
```

### 5.2 Token 预算

```typescript
type Budget = {
  maxTokens: number
  warningThreshold: number
  criticalThreshold: number
}

// 预算耗尽策略
const BUDGET_STRATEGIES = [
  'compact',      // 压缩上下文
  'summarize',    // 总结摘要
  'stop',         // 停止执行
]
```

## 6. 思考系统

### 6.1 thinking blocks

Claude Code 支持在响应中嵌入思考过程：

```typescript
// 思考块格式
{
  type: 'thinking',
  thinking: 'Let me analyze this problem...',
  thinking_loc: { input_tokens: 150 },
  signature: '...'
}

// 思考可以隐藏或显示
showThinking: boolean
```

### 6.2 推理策略

```typescript
const REASONING_STRATEGIES = {
  high: {
    maxThinkingTokens: 15000,
    includeVerification: true,
  },
  medium: {
    maxThinkingTokens: 8000,
    includeVerification: false,
  },
  low: {
    maxThinkingTokens: 2000,
  }
}
```

## 7. 安全机制

### 7.1 Bash 安全

```typescript
// 命令验证
validateCommand(command: string): ValidationResult {
  // 1. 检查黑名单
  if (DENY_LISTED.has(firstToken)) {
    return { allowed: false, reason: 'dangerous' }
  }
  
  // 2. 检查管道安全性
  if (hasUnsafePipeline(command)) {
    return { allowed: false, reason: 'unsafe pipeline' }
  }
  
  // 3. 检查路径遍历
  if (hasPathTraversal(command)) {
    return { allowed: false, reason: 'path traversal' }
  }
}
```

### 7.2 文件系统安全

```typescript
// 只允许在项目目录内操作
validatePath(path: string): boolean {
  const projectRoot = getProjectRoot()
  const resolved = resolve(path)
  return resolved.startsWith(projectRoot)
}
```

## 8. UI 组件 (Ink)

### 8.1 主要组件

```typescript
// 工具执行 UI
<ToolUseProgress />      // 进度显示
<ToolUseError />         // 错误显示
<ToolUseResult />        // 结果显示

// Agent UI
<AgentProgress />         // Agent 进度
<AgentThinking />         // 思考过程
<AgentResult />           // 结果

// 通用
<Spinner />              // 加载动画
<ProgressBar />          // 进度条
<Collapsible />          // 可折叠内容
```

### 8.2 渲染流程

```
Agent 执行
    ↓
状态更新 (React state)
    ↓
组件重渲染
    ↓
输出到终端
```

## 9. 状态管理

### 9.1 AppState

```typescript
type AppState = {
  // 会话
  sessionId: string
  messages: Message[]
  
  // Agent
  activeAgent?: AgentState
  agentHistory: AgentState[]
  
  // 工具
  toolUseHistory: ToolUse[]
  
  // 预算
  tokenBudget: Budget
  usage: Usage
  
  // UI
  theme: Theme
  panelState: PanelState
}
```

### 9.2 状态更新

```typescript
// 不可变更新
function updateState(state: AppState, patch: Partial<AppState>): AppState {
  return { ...state, ...patch }
}

// 中间件
const stateMiddleware = [
  persistMiddleware,    // 持久化
  analyticsMiddleware, // 分析
  budgetMiddleware,    // 预算检查
]
```

## 10. MCP 集成

### 10.1 MCP 协议

```typescript
// MCP 工具
type MCPTool = {
  name: string
  description: string
  inputSchema: JSONSchema
}

// MCP 资源
type MCPResource = {
  uri: string
  name: string
  mimeType: string
}
```

### 10.2 工具桥接

```typescript
// MCP → Claude Code 工具
function mcpToolToTool(mcpTool: MCPTool): Tool {
  return {
    name: `mcp_${mcpTool.name}`,
    inputSchema: mcpTool.inputSchema,
    async handle(params) {
      const result = await mcpClient.call(mcpTool.name, params)
      return result
    }
  }
}
```

## 11. 关键文件清单

| 文件 | 行数 | 功能 |
|------|------|------|
| `query.ts` | 2188 | 核心查询引擎 |
| `interactiveHelpers.tsx` | ~1600 | 交互助手 |
| `commands.ts` | ~1600 | 命令注册 |
| `tools.ts` | ~1400 | 工具注册 |
| `context.ts` | ~1200 | 上下文管理 |
| `Tool.ts` | ~800 | 工具基类 |
| `cost-tracker.ts` | ~600 | 成本追踪 |
| `history.ts` | ~500 | 历史管理 |

## 12. 学习要点

### 可移植到 OpenClaw 的部分

1. **工具架构** - 工具注册和执行模式 ✅ 已移植
2. **权限系统** - 命令白名单/黑名单 ✅ 已移植
3. **进度追踪** - Token 和工具使用追踪 ⏳ 待实现
4. **压缩系统** - 上下文压缩策略 ⏳ 待实现
5. **思考块** - 推理过程显示 ⏳ 待实现
6. **预算控制** - Token 预算管理 ⏳ 待实现

### Claude Code 独特部分

1. **Ink UI** - 无法直接移植 (OpenClaw 用不同 UI)
2. **AgentTool** - OpenClaw 有 sessions_spawn
3. **本地任务系统** - OpenClaw 有 subagent 系统
4. **VSCode 集成** - OpenClaw 无关

## 13. 参考实现

### 工具定义模式
```typescript
export const MyTool = buildTool({
  name: 'my_tool',
  inputSchema: Type.Object({ ... }),
  
  async description() {
    return 'What this tool does'
  },
  
  getToolUseSummary(input) {
    return `Doing something with ${input.param}`
  },
  
  async handle(params, context) {
    // 执行逻辑
    return { ok: true, result: { type: 'text', text: '...' } }
  }
})
```

### 权限检查模式
```typescript
function checkPermission(command: string, allowed: string[]): boolean {
  const token = command.split(' ')[0]
  return allowed.some(pattern => matchWildcard(pattern, token))
}
```
