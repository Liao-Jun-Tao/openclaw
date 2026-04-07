/**
 * Permission system ported from Claude Code.
 *
 * Sources:
 *  - hooks/useCanUseTool.tsx  (allow/deny/ask branching)
 *  - utils/permissions/permissionSetup.ts  (PermissionMode, rules from disk)
 *  - utils/permissions/dangerousPatterns.ts  (dangerous bash patterns)
 */

// ---------------------------------------------------------------------------
// PermissionMode (ported from Claude Code types/permissions.ts)
// ---------------------------------------------------------------------------

export type PermissionMode = "default" | "auto" | "ask-always";

// ---------------------------------------------------------------------------
// Permission rule types
// ---------------------------------------------------------------------------

export type PermissionBehavior = "allow" | "deny" | "ask";

export interface PermissionRule {
  toolName: string;
  behavior: PermissionBehavior;
  pattern?: string;
  reason?: string;
}

export interface PermissionResult {
  behavior: PermissionBehavior;
  updatedInput?: Record<string, unknown>;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Dangerous bash patterns (ported from Claude Code dangerousPatterns.ts)
// ---------------------------------------------------------------------------

const DANGEROUS_BASH_PATTERNS: RegExp[] = [
  /\brm\s+-rf\s+\//,
  /\bdd\s+/,
  /\bmkfs\b/,
  /\b(shutdown|reboot|halt|poweroff)\b/,
  /\bchmod\s+777\b/,
  />\s*\/dev\/sd/,
  /\bcurl\b.*\|\s*(bash|sh|zsh)/,
  /\bwget\b.*\|\s*(bash|sh|zsh)/,
  /:\(\)\s*\{\s*:\|:&\s*\}\s*;/,
];

const CROSS_PLATFORM_CODE_EXEC: string[] = [
  "python",
  "python3",
  "node",
  "ruby",
  "perl",
  "php",
  "lua",
  "bash",
  "zsh",
  "sh",
  "fish",
  "pwsh",
];

// ---------------------------------------------------------------------------
// Command risk classification
// ---------------------------------------------------------------------------

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface CommandRiskAssessment {
  command: string;
  firstToken: string;
  risk: RiskLevel;
  isDangerous: boolean;
  matchedPatterns: string[];
}

export function assessCommandRisk(command: string): CommandRiskAssessment {
  const trimmed = command.trim();
  const firstToken = trimmed.split(/\s+/)[0]?.toLowerCase() ?? "";
  const matchedPatterns: string[] = [];
  let risk: RiskLevel = "low";

  for (const pattern of DANGEROUS_BASH_PATTERNS) {
    if (pattern.test(trimmed)) {
      matchedPatterns.push(pattern.source);
      risk = "critical";
    }
  }

  if (CROSS_PLATFORM_CODE_EXEC.includes(firstToken)) {
    risk = risk === "critical" ? "critical" : "medium";
  }

  if (["sudo", "su", "chroot"].includes(firstToken)) {
    risk = "critical";
  }

  if (["rm", "mv", "dd"].includes(firstToken)) {
    if (risk !== "critical") {
      risk = "high";
    }
  }

  if (trimmed.includes("|") && CROSS_PLATFORM_CODE_EXEC.some((cmd) => trimmed.includes(cmd))) {
    if (risk === "low") {
      risk = "medium";
    }
  }

  return {
    command: trimmed,
    firstToken,
    risk,
    isDangerous: risk === "critical" || risk === "high",
    matchedPatterns,
  };
}

// ---------------------------------------------------------------------------
// Path validation (ported from Claude Code sandbox path checking)
// ---------------------------------------------------------------------------

export function isPathWithinWorkspace(targetPath: string, workspaceRoot: string): boolean {
  const path = require("node:path");
  const resolved = path.resolve(targetPath);
  const resolvedRoot = path.resolve(workspaceRoot);
  return resolved === resolvedRoot || resolved.startsWith(resolvedRoot + path.sep);
}

const SENSITIVE_PATHS = [
  "/etc/passwd",
  "/etc/shadow",
  "/etc/sudoers",
  "/etc/ssh",
  "/root",
  "/proc",
  "/sys",
  "/dev",
];

export function isSensitivePath(targetPath: string): boolean {
  const path = require("node:path");
  const resolved = path.resolve(targetPath);
  return SENSITIVE_PATHS.some(
    (sensitive) => resolved === sensitive || resolved.startsWith(sensitive + "/"),
  );
}

// ---------------------------------------------------------------------------
// Permission checker (integrates with buildTool checkPermissions)
// ---------------------------------------------------------------------------

export interface PermissionContext {
  mode: PermissionMode;
  rules: PermissionRule[];
  workspaceRoot: string;
}

export function checkToolPermission(
  toolName: string,
  input: Record<string, unknown>,
  ctx: PermissionContext,
): PermissionResult {
  // Ask-always mode
  if (ctx.mode === "ask-always") {
    return { behavior: "ask", reason: "ask-always mode is active" };
  }

  // Check explicit rules (deny takes precedence)
  for (const rule of ctx.rules) {
    if (rule.toolName !== toolName) {
      continue;
    }

    if (rule.behavior === "deny") {
      if (!rule.pattern || matchesPattern(input, rule.pattern)) {
        return { behavior: "deny", reason: rule.reason ?? "Denied by rule" };
      }
    }
  }

  for (const rule of ctx.rules) {
    if (rule.toolName !== toolName) {
      continue;
    }

    if (rule.behavior === "allow") {
      if (!rule.pattern || matchesPattern(input, rule.pattern)) {
        return { behavior: "allow", updatedInput: input };
      }
    }
  }

  // Default mode: allow unless specifically dangerous
  if (ctx.mode === "default" || ctx.mode === "auto") {
    // For bash tools, check command risk
    if (toolName === "bash" && typeof input.command === "string") {
      const risk = assessCommandRisk(input.command);
      if (risk.isDangerous) {
        return { behavior: "ask", reason: `Dangerous command detected: ${risk.risk} risk` };
      }
    }

    // For edit tools, check path safety
    if (toolName === "edit" && typeof input.path === "string") {
      if (isSensitivePath(input.path)) {
        return { behavior: "deny", reason: "Editing sensitive system path" };
      }
    }

    return { behavior: "allow", updatedInput: input };
  }

  return { behavior: "ask", reason: "No matching rule" };
}

function matchesPattern(input: Record<string, unknown>, pattern: string): boolean {
  const serialized = JSON.stringify(input);
  try {
    return new RegExp(pattern).test(serialized);
  } catch {
    return serialized.includes(pattern);
  }
}
