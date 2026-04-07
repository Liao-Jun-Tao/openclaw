/**
 * Claude Code 风格的安全系统
 * 基于 Claude Code CLI 的 bashSecurity.ts (2592行) 和 bashPermissions.ts (2621行)
 */

import { DENY_LISTED_COMMANDS, type ValidationResult } from "./constants.js";

// ============================================================================
// 命令分类
// ============================================================================

export type CommandCategory =
  | "read"      // 读取操作 (cat, grep, ls, head, tail, etc.)
  | "write"     // 写入操作 (echo, tee, write to file)
  | "execute"   // 执行操作 (bash, zsh, python, node, etc.)
  | "git"       // Git 操作
  | "network"   // 网络操作 (curl, wget, ssh, etc.)
  | "system"    // 系统操作 (ps, kill, top, etc.)
  | "admin"     // 管理操作 (sudo, chmod, chown, etc.)
  | "dangerous" // 危险操作
  | "unknown";

const COMMAND_CATEGORIES: Record<string, CommandCategory> = {
  // Read operations
  cat: "read",
  grep: "read",
  rg: "read",
  ag: "read",
  find: "read",
  head: "read",
  tail: "read",
  less: "read",
  more: "read",
  wc: "read",
  sort: "read",
  uniq: "read",
  cut: "read",
  ls: "read",
  tree: "read",
  stat: "read",
  file: "read",
  diff: "read",
  comm: "read",

  // Write operations
  echo: "write",
  tee: "write",
  printf: "write",
  write: "write",

  // Execute operations
  bash: "execute",
  zsh: "execute",
  sh: "execute",
  python: "execute",
  python3: "execute",
  node: "execute",
  ruby: "execute",
  perl: "execute",
  php: "execute",
  lua: "execute",
  run: "execute",

  // Git operations
  git: "git",
  gh: "git",

  // Network operations
  curl: "network",
  wget: "network",
  ssh: "network",
  scp: "network",
  rsync: "network",
  nc: "network",
  netcat: "network",
  ping: "network",
  traceroute: "network",
  curl: "network",

  // System operations
  ps: "system",
  top: "system",
  htop: "system",
  kill: "system",
  pkill: "system",
  killall: "system",
  top: "system",
  df: "system",
  du: "system",
  free: "system",
  uptime: "system",
  who: "system",
  w: "system",
  id: "system",
  uname: "system",
  arch: "system",

  // Admin operations
  sudo: "admin",
  su: "admin",
  chmod: "admin",
  chown: "admin",
  chgrp: "admin",
  passwd: "admin",
  adduser: "admin",
  deluser: "admin",

  // Potentially dangerous
  rm: "dangerous",
  mv: "dangerous",
  cp: "dangerous",
  dd: "dangerous",
  mkfs: "dangerous",
  mount: "dangerous",
  umount: "dangerous",
  reboot: "dangerous",
  shutdown: "dangerous",
  halt: "dangerous",
  poweroff: "dangerous",
  init: "dangerous",
  systemctl: "dangerous",
  service: "dangerous",
};

// ============================================================================
// 路径验证
// ============================================================================

export function validatePath(path: string, projectRoot: string): boolean {
  // 禁止的路径模式
  const FORBIDDEN_PATTERNS = [
    /^\.\./,                    // 相对路径遍历
    /^\//,                      // 绝对路径（限制在项目内）
    /~/,                        // HOME 目录
    /\.\.\//,                   // 路径遍历
    /\/etc\//,                  // 系统配置
    /\/usr\//,                  // 系统目录
    /\/sys\//,                  // 系统信息
    /\/proc\//,                 // 进程信息
    /\/dev\//,                  // 设备文件
  ];

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(path)) {
      return false;
    }
  }

  // 验证最终路径在项目目录内
  const resolved = path.resolve(path);
  return resolved.startsWith(projectRoot);
}

// ============================================================================
// Sed 命令验证
// ============================================================================

export interface SedValidation {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

export function validateSedCommand(command: string): SedValidation {
  // Sed 替换模式
  const sedPattern = /^sed\s+(-E|-e)?\s*['"]?s\/(.+)\/(.+)\/[gimp]?['"]?$/;

  const match = command.match(sedPattern);
  if (!match) {
    return { valid: false, error: "Invalid sed syntax" };
  }

  const [, , pattern, replacement] = match;

  // 检查替换内容是否包含危险字符
  const dangerousPatterns = [
    />/,     // 输出重定向
    /\|/,    // 管道
    /;/,     // 命令分隔
    /&/,     // 后台执行
    /\$\(/,  // 命令替换
    /`/,     // 反引号替换
  ];

  for (const dp of dangerousPatterns) {
    if (dp.test(replacement)) {
      return { valid: false, error: "Replacement contains dangerous characters" };
    }
  }

  return { valid: true, sanitized: command };
}

// ============================================================================
// 管道验证
// ============================================================================

export interface PipelineValidation {
  valid: boolean;
  stages: string[];
  hasDangerousStage: boolean;
  dangerousStages: number[];
}

export function validatePipeline(command: string): PipelineValidation {
  const stages = command.split("|").map((s) => s.trim());
  const dangerousStages: number[] = [];

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const firstToken = stage.split(/\s+/)[0];

    if (firstToken === "sh" || firstToken === "bash" || firstToken === "zsh") {
      dangerousStages.push(i);
    }
  }

  return {
    valid: dangerousStages.length === 0,
    stages,
    hasDangerousStage: dangerousStages.length > 0,
    dangerousStages,
  };
}

// ============================================================================
// 主验证函数
// ============================================================================

export interface SecurityValidation {
  allowed: boolean;
  reason?: string;
  category: CommandCategory;
  risk: "low" | "medium" | "high" | "critical";
  suggestions?: string[];
}

export function validateBashCommand(
  command: string,
  options: {
    allowedCommands?: string[];
    deniedCommands?: string[];
    projectRoot?: string;
    allowNetwork?: boolean;
    allowAdmin?: boolean;
  } = {}
): SecurityValidation {
  const {
    allowedCommands = [],
    deniedCommands = [],
    projectRoot = process.cwd(),
    allowNetwork = false,
    allowAdmin = false,
  } = options;

  // 清理命令
  const trimmed = command.trim();
  const firstToken = trimmed.split(/\s+/)[0].toLowerCase();

  // 1. 检查危险命令黑名单
  if (DENY_LISTED_COMMANDS.has(firstToken)) {
    return {
      allowed: false,
      reason: `Command '${firstToken}' is blocked for security`,
      category: "dangerous",
      risk: "critical",
    };
  }

  // 2. 检查自定义黑名单
  if (deniedCommands.includes(firstToken)) {
    return {
      allowed: false,
      reason: `Command '${firstToken}' is explicitly denied`,
      category: "dangerous",
      risk: "high",
    };
  }

  // 3. 检查白名单
  if (allowedCommands.length > 0 && !allowedCommands.includes(firstToken)) {
    return {
      allowed: false,
      reason: `Command '${firstToken}' is not in the allowed list`,
      category: "unknown",
      risk: "medium",
    };
  }

  // 4. 分类命令
  const category = COMMAND_CATEGORIES[firstToken] || "unknown";

  // 5. 风险评估
  let risk: SecurityValidation["risk"] = "low";
  const suggestions: string[] = [];

  switch (category) {
    case "dangerous":
      risk = "high";
      if (firstToken === "rm") {
        suggestions.push("Consider using 'git rm' instead for safer deletion");
        suggestions.push("Use -i flag for interactive mode");
      }
      break;

    case "admin":
      if (!allowAdmin) {
        risk = "critical";
        return {
          allowed: false,
          reason: "Admin commands require explicit permission",
          category,
          risk,
        };
      }
      risk = "high";
      break;

    case "network":
      if (!allowNetwork) {
        risk = "medium";
        suggestions.push("Network commands are disabled by default");
      }
      break;

    case "execute":
      risk = "medium";
      suggestions.push("Ensure the script is trusted before running");
      break;

    case "unknown":
      risk = "medium";
      break;
  }

  // 6. 特殊检查
  if (trimmed.includes("&&") || trimmed.includes("||")) {
    risk = "medium";
    suggestions.push("Compound commands are executed as a single unit");
  }

  if (trimmed.includes(">") || trimmed.includes(">>")) {
    risk = "medium";
    suggestions.push("Output redirection detected - file will be modified");
  }

  return {
    allowed: true,
    category,
    risk,
    suggestions,
  };
}

// ============================================================================
// 工具函数
// ============================================================================

export function classifyCommandRisk(commands: string[]): {
  overall: SecurityValidation["risk"];
  byCommand: Map<string, SecurityValidation["risk"]>;
} {
  const byCommand = new Map<string, SecurityValidation["risk"]>();
  let overall: SecurityValidation["risk"] = "low";

  for (const cmd of commands) {
    const result = validateBashCommand(cmd);
    byCommand.set(cmd, result.risk);

    if (result.risk === "critical") {
      overall = "critical";
    } else if (result.risk === "high" && overall !== "critical") {
      overall = "high";
    } else if (result.risk === "medium" && overall === "low") {
      overall = "medium";
    }
  }

  return { overall, byCommand };
}

export function formatSecurityWarning(validation: SecurityValidation): string {
  let warning = `⚠️  Command risk: ${validation.risk.toUpperCase()}`;

  if (validation.reason) {
    warning += `\n  Reason: ${validation.reason}`;
  }

  warning += `\n  Category: ${validation.category}`;

  if (validation.suggestions && validation.suggestions.length > 0) {
    warning += "\n  Suggestions:";
    for (const s of validation.suggestions) {
      warning += `\n    - ${s}`;
    }
  }

  return warning;
}
