/**
 * Claude Code 兼容插件常量
 * 基于 Claude Code CLI 的安全配置
 */

// ============================================================================
// 危险命令黑名单
// ============================================================================

export const DENY_LISTED_COMMANDS = new Set([
  // Bash 内置 - 可能用于绕过限制
  ":",              // 空命令
  "alias",          // 命令别名
  "bind",           // 键盘绑定
  "builtin",        // 内置命令
  "declare",        // 变量声明
  "dirs",           // 目录栈
  "disable",        // 禁用内置
  "enable",         // 启用内置
  "eval",           // _eval 执行
  "exec",           // _exec 执行
  "export",         // 导出变量
  "history",        // 命令历史
  "local",          // 局部变量
  "logout",        // 退出登录
  "popd",           // 目录栈弹出
  "pushd",          // 目录栈压入
  "read",           // 读取输入
  "readonly",       // 只读变量
  "set",            // 设置选项
  "shopt",          // Shell 选项
  "source",         // _source 执行
  "type",           // 命令类型
  "typeset",        // 类型声明
  "ulimit",         // 资源限制
  "unalias",        // 取消别名
  "unset",          // 取消变量
  "set",            // 设置变量

  // 危险的第三方命令
  "sudo",           // 超级用户执行
  "su",             // 切换用户
  "chroot",         // 改变根目录
  "fakeroot",       // 伪 root
  "nohup",          // 忽略挂断信号 (配合其他命令危险)

  // 潜在的绕过
  "python",         // Python 解释器 (可能被用于绕过)
  "python3",
  "node",           // Node.js (可能被用于绕过)
  "ruby",           // Ruby (可能被用于绕过)
  "perl",           // Perl (可能被用于绕过)
  "php",            // PHP (可能被用于绕过)
  "lua",            // Lua (可能被用于绕过)
  "bash",           // Bash (可能被用于绕过)
  "zsh",            // Zsh (可能被用于绕过)
  "sh",             // Shell (可能被用于绕过)
  "fish",           // Fish (可能被用于绕过)
  "pwsh",           // PowerShell (可能被用于绕过)

  // 危险的系统命令
  ":(){ :|:& };:",  // Fork 炸弹
  "fork",           // Fork
]);

// ============================================================================
// 允许的 Git 命令
// ============================================================================

export const ALLOWED_GIT_COMMANDS = [
  "status",
  "log",
  "show",
  "diff",
  "blame",
  "branch",
  "checkout",
  "clone",
  "fetch",
  "pull",
  "push",
  "merge",
  "rebase",
  "stash",
  "tag",
  "add",
  "commit",
  "reset",
  "restore",
  "rm",
  "mv",
  "ls-files",
  "ls-tree",
  "rev-parse",
  "rev-list",
  "shortlog",
  "describe",
  "whatchanged",
  "show-ref",
  "remote",
  "config",
  "init",
  "archive",
  "bundle",
  "bisect",
  "grep",
  "diff-index",
  "diff-tree",
  "cat-file",
  "hash-object",
  "update-index",
  "write-tree",
  "read-tree",
  "commit-tree",
  "format-patch",
  "send-email",
  "request-pull",
  " arches",
];

// ============================================================================
// 工具名称常量
// ============================================================================

export const TOOL_NAMES = {
  BASH: "bash",
  READ: "read",
  EDIT: "edit",
  GLOB: "glob",
  GREP: "grep",
  AGENT: "Agent",
  TASK: "Task",
} as const;

// ============================================================================
// 风险等级
// ============================================================================

export type RiskLevel = "low" | "medium" | "high" | "critical";

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: "🟢",
  medium: "🟡",
  high: "🟠",
  critical: "🔴",
};

// ============================================================================
// 验证结果
// ============================================================================

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  command: string;
}

// ============================================================================
// Token 限制
// ============================================================================

export const TOKEN_LIMITS = {
  // 默认限制
  DEFAULT_MAX_TOKENS: 4096,

  // 各模型限制
  MAX_TOKENS_BY_MODEL: {
    "claude-3-5-sonnet": 8192,
    "claude-3-5-haiku": 4096,
    "claude-3-opus": 4096,
    "claude-3-sonnet": 4096,
    "claude-3-haiku": 4096,
  },

  // 思考限制
  THINKING: {
    HIGH: 15000,
    MEDIUM: 8000,
    LOW: 2000,
    OFF: 0,
  },
} as const;

// ============================================================================
// 压缩阈值
// ============================================================================

export const COMPACT_THRESHOLDS = {
  // 自动压缩触发
  AUTO_COMPACT: {
    MIN_TURNS: 6,
    MIN_MESSAGES: 10,
    TOKEN_THRESHOLD: 0.85,  // 85% context usage
    WARNING_THRESHOLD: 0.70,  // 70% 时开始警告
  },

  // 紧急压缩
  EMERGENCY_COMPACT: {
    TOKEN_THRESHOLD: 0.95,  // 95% 时强制压缩
    MIN_TURNS: 3,
  },
} as const;

// ============================================================================
// UI 常量
// ============================================================================

export const UI = {
  // 加载动画
  SPINNER_FRAMES: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],

  // 进度条
  PROGRESS_BAR_LENGTH: 30,

  // 截断
  MAX_PREVIEW_LINES: 100,
  MAX_TOOL_OUTPUT_LINES: 500,
  MAX_TOOL_OUTPUT_CHARS: 50000,

  // 颜色
  COLORS: {
    RESET: "\x1b[0m",
    BOLD: "\x1b[1m",
    RED: "\x1b[31m",
    GREEN: "\x1b[32m",
    YELLOW: "\x1b[33m",
    BLUE: "\x1b[34m",
    MAGENTA: "\x1b[35m",
    CYAN: "\x1b[36m",
  },
} as const;
