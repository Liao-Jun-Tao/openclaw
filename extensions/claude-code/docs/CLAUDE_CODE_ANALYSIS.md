# Claude Code CLI 深度学习总结

## 📊 源码规模

```
文件总数: ~1884 TypeScript 文件
核心文件:
├── query.ts              - 2188 行，核心查询引擎
├── interactiveHelpers.tsx - ~1600 行，交互助手
├── commands.ts           - ~1600 行，命令系统
├── tools.ts             - ~1400 行，工具注册
├── context.ts           - ~1200 行，上下文管理
└── Tool.ts              - ~800 行，工具基类

工具系统:
├── BashTool/           - 2592 行 (bashSecurity) + 2621 行 (bashPermissions)
├── AgentTool/          - Agent 嵌套执行
├── FileEditTool/       - 文件编辑
├── FileReadTool/       - 文件读取
└── 30+ 更多工具
```

## 🎯 核心系统分析

### 1. 工具系统

**架构模式:**
```typescript
// 每个工具继承统一接口
class Tool {
  name: string
  inputSchema: Schema
  outputSchema?: Schema

  async description()
  async prompt()
  async handle(params, context): Promise<ToolResult>
}
```

**安全机制 (bashPermissions.ts + bashSecurity.ts = 5213 行):**
- AST 命令解析
- 白名单/黑名单机制
- 管道安全性检查
- 路径遍历防护
- Sed 命令验证
- 沙箱执行

### 2. Agent 系统

**LocalAgentTask:**
```typescript
// 状态机
type AgentState = {
  type: 'local_agent'
  agentId: string
  prompt: string
  model?: string
  progress?: {
    toolUseCount: number
    latestInputTokens: number
    recentActivities: ToolActivity[]
  }
}
```

**特点:**
- 支持嵌套执行
- Token 预算控制
- 进度追踪
- 背景执行

### 3. 查询引擎 (query.ts)

**主循环:**
```
消息输入
    ↓
构建提示词 (system + messages)
    ↓
流式生成 (streaming)
    ↓
解析块 (text / tool_use / thinking)
    ↓
执行工具
    ↓
循环 (loop) 或结束
```

**关键优化:**
- 增量处理
- 错误恢复
- 预算管理
- 上下文管理

### 4. 上下文管理

**压缩策略 (services/compact/):**
```typescript
// 自动压缩触发
AUTO_COMPACT: {
  minTurns: 6,
  minMessages: 10,
  tokenThreshold: 0.85,
}

// 压缩策略
- microcompact:  掐头去尾
- autoCompact:   智能摘要
- snip:         选择性删除
```

### 5. 思考系统

**思考块格式:**
```typescript
{
  type: 'thinking',
  thinking: 'Let me analyze...',
  thinking_loc: { input_tokens: 150 },
  signature: '...'  // 防篡改
}
```

**推理策略:**
```typescript
REASONING: {
  high: { maxTokens: 15000, verification: true },
  medium: { maxTokens: 8000, verification: false },
  low: { maxTokens: 2000 }
}
```

## 🔐 安全架构

### Claude Code 安全策略 (5213 行安全代码)

**1. 命令分类:**
```typescript
category = {
  read:    cat, grep, ls, head, tail...,
  write:   echo, tee, printf...,
  execute: bash, python, node...,
  git:     git, gh...,
  network: curl, wget, ssh...,
  system:  ps, kill, top...,
  admin:   sudo, chmod, chown...,
  dangerous: rm, dd, mkfs...,
}
```

**2. 验证流程:**
```
用户命令
    ↓
词法分析 (提取 token)
    ↓
黑名单检查 (DENY_LISTED)
    ↓
白名单检查 (allowedCommands)
    ↓
管道安全检查
    ↓
路径遍历检查
    ↓
危险模式检测 (fork bomb, etc.)
    ↓
风险评估
    ↓
执行 / 拒绝 / 警告
```

**3. 路径安全:**
```typescript
validatePath(path, projectRoot) {
  // 禁止绝对路径
  // 禁止 .. 遍历
  // 禁止 /etc, /usr, /sys, /proc
  // 必须在 projectRoot 内
}
```

## 📈 可学习的技术

### 1. 渐进式复杂度处理

Claude Code 的设计哲学:
- 简单任务 → 直接执行
- 复杂任务 → Agent 嵌套
- 超长会话 → 自动压缩

### 2. 错误恢复机制

```typescript
// 重试策略
const RETRY_STRATEGIES = {
  transient: { retries: 3, backoff: 'exponential' },
  auth: { retries: 1, action: 'reauth' },
  budget: { retries: 0, action: 'compact' },
}
```

### 3. 状态管理

```typescript
// 不可变更新
updateState(state, patch) {
  return { ...state, ...patch }
}

// 中间件
stateMiddleware = [
  persistMiddleware,    // 持久化
  analyticsMiddleware, // 分析
  budgetMiddleware,    // 预算
  securityMiddleware,  // 安全
]
```

### 4. 流式处理

```typescript
// SSE 流式输出
for await (const chunk of stream) {
  // 增量渲染
  // 缓冲输出
  // 错误恢复
}
```

## 🎓 最佳实践

### 1. 工具设计

```typescript
// ✅ 好的工具设计
Tool = {
  name: 'bash',
  inputSchema: { command: string, context?: {...} },
  outputSchema: { stdout, stderr, exitCode },

  async handle(params) {
    // 1. 验证输入
    // 2. 安全检查
    // 3. 执行
    // 4. 格式化输出
    // 5. 错误处理
  }
}
```

### 2. Agent 设计

```typescript
// ✅ 好的 Agent 设计
Agent = {
  // 1. 清晰的目标
  // 2. 有限的 Token 预算
  // 3. 进度追踪
  // 4. 超时处理
  // 5. 优雅的失败

  async run(task) {
    const budget = new Budget(task.maxTokens)
    const tracker = new ProgressTracker()

    while (!task.complete && budget.remaining > 0) {
      const response = await model.generate({
        messages,
        maxTokens: budget.nextTurn()
      })

      tracker.record(response)

      for (const block of response.blocks) {
        if (block.type === 'tool_use') {
          await executeTool(block)
        } else if (block.type === 'stop') {
          return tracker.finalize()
        }
      }
    }
  }
}
```

### 3. 安全设计

```typescript
// ✅ 深度防御
Security = {
  // 1. 输入验证
  validateInput(input),

  // 2. 命令分类
  classify(command),

  // 3. 权限检查
  checkPermission(command, rules),

  // 4. 风险评估
  assessRisk(classification),

  // 5. 执行隔离
  executeInSandbox(command),

  // 6. 审计日志
  log(command, result),
}
```

## 📚 参考链接

- Claude Code 源码: `/Users/liaojuntao/01_Projects/Personal/claude-code-cli`
- 核心文件:
  - `query.ts` - 查询引擎
  - `Tool.ts` - 工具基类
  - `tools/BashTool/bashSecurity.ts` - 安全系统 (2592 行)
  - `tools/BashTool/bashPermissions.ts` - 权限系统 (2621 行)
  - `tasks/LocalAgentTask/` - Agent 任务

## 🔧 OpenClaw 插件实现

已实现的 Claude Code 功能:

| 功能 | 状态 | 源码 |
|------|------|------|
| Bash 工具 | ✅ | `src/tools/bash-tool.ts` |
| 文件读取 | ✅ | `src/tools/file-read-tool.ts` |
| 文件编辑 | ✅ | `src/tools/file-edit-tool.ts` |
| Glob 搜索 | ✅ | `src/tools/glob-tool.ts` |
| Grep 搜索 | ✅ | `src/tools/grep-tool.ts` |
| 安全系统 | ✅ | `src/security.ts` |
| 命令常量 | ✅ | `src/constants.ts` |
| 命令技能 | ✅ (25+) | `skills/*/SKILL.md` |

待实现的高级功能:
- 思考块可视化
- 自动压缩系统
- Token 预算追踪
- Agent 嵌套执行 (使用 sessions_spawn)
