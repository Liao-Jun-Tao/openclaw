# Claude Code 学习路线图

## 循序渐进的学习路径

### 第 1 阶段：工具系统 (1-2 天)

**目标:** 理解 Claude Code 的工具架构

**文件:**
1. `Tool.ts` (800 行) - 工具基类
2. `tools.ts` (1400 行) - 工具注册表
3. `tools/BashTool/BashTool.tsx` - Bash 工具实现
4. `tools/FileEditTool/FileEditTool.ts` - 文件编辑

**关键概念:**
- Tool 基类接口
- Schema 定义 (Zod)
- 工具执行上下文
- 权限控制

**练习:**
- 实现一个简单的 `read` 工具
- 实现一个 `write` 工具

---

### 第 2 阶段：Agent 系统 (2-3 天)

**目标:** 理解 Agent 的嵌套执行

**文件:**
1. `tools/AgentTool/AgentTool.tsx` - Agent 工具
2. `tasks/LocalAgentTask/LocalAgentTask.tsx` - 本地 Agent
3. `Task.ts` - 任务基类

**关键概念:**
- Agent 状态机
- 进度追踪
- Token 预算
- 嵌套执行

**练习:**
- 使用 sessions_spawn 创建一个子 Agent
- 实现进度显示

---

### 第 3 阶段：查询引擎 (3-5 天)

**目标:** 理解消息处理主循环

**文件:**
1. `query.ts` (2188 行) - 核心引擎 ⭐️ 最重要
2. `context.ts` (1200 行) - 上下文管理

**关键概念:**
- 消息构建
- 流式处理
- 工具循环
- 错误恢复

**练习:**
- 分析 query.ts 的主循环
- 实现一个简化版的工具循环

---

### 第 4 阶段：安全系统 (3-5 天)

**目标:** 理解命令安全性

**文件:**
1. `tools/BashTool/bashPermissions.ts` (2621 行) ⭐️ 最复杂
2. `tools/BashTool/bashSecurity.ts` (2592 行) ⭐️ 最复杂

**关键概念:**
- AST 命令解析
- 命令分类
- 白名单/黑名单
- 路径验证
- Sed 验证

**练习:**
- 分析命令分类逻辑
- 实现一个简化的命令验证器

---

### 第 5 阶段：上下文管理 (2-3 天)

**目标:** 理解长会话处理

**文件:**
1. `services/compact/compact.ts` - 压缩逻辑
2. `services/compact/autoCompact.ts` - 自动压缩
3. `cost-tracker.ts` - 成本追踪

**关键概念:**
- Token 预算
- 自动压缩触发
- 摘要生成
- 掐头去尾

---

### 第 6 阶段：UI 组件 (2-3 天)

**目标:** 理解 Ink 组件

**文件:**
1. `tools/BashTool/UI.tsx` - Bash UI
2. `tools/AgentTool/UI.tsx` - Agent UI
3. `interactiveHelpers.tsx` (1600 行) - 交互组件

**关键概念:**
- React for CLI
- 进度显示
- 错误展示
- 动画效果

---

## 重点文件详解

### 🔴 高优先级 (必读)

| 文件 | 行数 | 重要性 | 原因 |
|------|------|--------|------|
| `query.ts` | 2188 | ⭐⭐⭐⭐⭐ | 核心查询引擎，主循环 |
| `Tool.ts` | 800 | ⭐⭐⭐⭐⭐ | 工具基类，接口定义 |
| `tools.ts` | 1400 | ⭐⭐⭐⭐ | 工具注册方式 |
| `Task.ts` | ~400 | ⭐⭐⭐⭐ | 任务抽象 |

### 🟡 中优先级 (推荐)

| 文件 | 行数 | 重要性 | 原因 |
|------|------|--------|------|
| `bashPermissions.ts` | 2621 | ⭐⭐⭐⭐ | 安全机制，命令分类 |
| `bashSecurity.ts` | 2592 | ⭐⭐⭐⭐ | 安全机制，命令验证 |
| `context.ts` | 1200 | ⭐⭐⭐ | 上下文管理 |
| `interactiveHelpers.tsx` | 1600 | ⭐⭐⭐ | UI 组件模式 |

### 🟢 低优先级 (选读)

| 文件 | 行数 | 重要性 | 原因 |
|------|------|--------|------|
| `compact.ts` | ~500 | ⭐⭐ | 压缩逻辑 |
| `cost-tracker.ts` | ~600 | ⭐⭐ | 成本追踪 |
| `AgentTool.tsx` | ~600 | ⭐⭐ | Agent 工具 |
| `history.ts` | ~500 | ⭐ | 历史管理 |

---

## 学习技巧

### 1. 从主循环开始

```
query.ts 的主循环是核心:
1. 构建消息
2. 发送请求
3. 处理响应
4. 执行工具
5. 循环或结束
```

### 2. 理解工具执行

```
工具执行流程:
1. 用户触发工具
2. 解析参数
3. 安全检查
4. 执行工具
5. 格式化结果
6. 返回给模型
```

### 3. 安全为先

Claude Code 的安全系统占了很大比重:
- 命令分类
- 权限检查
- 路径验证
- Sandbox 执行

### 4. 渐进式学习

```
Day 1: 工具基类 + 一个简单工具
Day 2: Agent 系统 + 任务执行
Day 3: 查询引擎 + 主循环
Day 4: 安全系统 + 权限
Day 5: 上下文管理 + 压缩
```

---

## 实践项目

### 项目 1: 实现一个安全 Bash 工具 (1 天)

```typescript
// 实现要点:
// 1. 命令解析
// 2. 危险命令检测
// 3. 路径验证
// 4. 执行和输出
```

### 项目 2: 实现上下文压缩 (1-2 天)

```typescript
// 实现要点:
// 1. Token 计数
// 2. 压缩触发检测
// 3. 消息摘要
// 4. 历史裁剪
```

### 项目 3: 实现进度追踪 (1 天)

```typescript
// 实现要点:
// 1. Token 统计
// 2. 工具使用计数
// 3. 进度计算
// 4. UI 显示
```

---

## 参考资料

### Claude Code 源码
```
/Users/liaojuntao/01_Projects/Personal/claude-code-cli/
├── query.ts              # 核心
├── Tool.ts              # 工具基类
├── tools.ts             # 工具注册
├── tools/
│   ├── BashTool/
│   │   ├── BashTool.tsx
│   │   ├── bashPermissions.ts  # 2621 行!
│   │   └── bashSecurity.ts    # 2592 行!
│   ├── AgentTool/
│   ├── FileEditTool/
│   └── FileReadTool/
├── tasks/
│   └── LocalAgentTask/
├── services/
│   └── compact/
└── state/
```

### 快速查看命令

```bash
# 查看核心文件
head -100 query.ts

# 查看工具基类
head -100 Tool.ts

# 查看安全系统
head -100 tools/BashTool/bashPermissions.ts

# 统计文件行数
wc -l *.ts
```

---

## 总结

Claude Code 是一个非常复杂的系统，但核心概念其实很简单:

1. **工具系统** - 扩展模型能力
2. **Agent 系统** - 嵌套执行复杂任务
3. **查询引擎** - 消息循环处理
4. **安全系统** - 命令验证保护
5. **上下文管理** - 长会话处理

从 query.ts 开始，逐个击破！
