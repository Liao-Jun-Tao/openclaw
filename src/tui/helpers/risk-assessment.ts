/**
 * Standalone command risk assessment for the TUI permission dialog.
 * Ported from Claude Code patterns -- kept in core to avoid extension imports.
 */

export type RiskLevel = "low" | "medium" | "high" | "critical";

const CRITICAL_PATTERNS = [
  /\brm\s+-rf?\s+[/~]/,
  /\bsudo\s+rm\b/,
  /\bmkfs\b/,
  /\bdd\s+.*of=\/dev\//,
  /\b:(){.*};:/,
  />\s*\/dev\/sd[a-z]/,
  /\bchmod\s+-R\s+777\s+\//,
  /\bgit\s+push\s+.*--force/,
  /\bgit\s+reset\s+--hard/,
] as const;

const HIGH_PATTERNS = [
  /\bsudo\b/,
  /\brm\s+-r/,
  /\bchmod\b/,
  /\bchown\b/,
  /\bkill\s+-9/,
  /\bpkill\b/,
  /\bcurl\b.*\|\s*(ba)?sh/,
  /\bwget\b.*\|\s*(ba)?sh/,
  /\bnpm\s+publish\b/,
  /\bgit\s+push\b/,
] as const;

const MEDIUM_PATTERNS = [
  /\bgit\s+commit\b/,
  /\bgit\s+checkout\b/,
  /\bgit\s+merge\b/,
  /\bgit\s+rebase\b/,
  /\bnpm\s+install\b/,
  /\bpnpm\s+install\b/,
  /\byarn\s+add\b/,
  /\bmv\b/,
  /\bcp\s+-r/,
] as const;

export function assessCommandRisk(command: string): RiskLevel {
  for (const pattern of CRITICAL_PATTERNS) {
    if (pattern.test(command)) {
      return "critical";
    }
  }
  for (const pattern of HIGH_PATTERNS) {
    if (pattern.test(command)) {
      return "high";
    }
  }
  for (const pattern of MEDIUM_PATTERNS) {
    if (pattern.test(command)) {
      return "medium";
    }
  }
  return "low";
}

export function riskLabel(level: RiskLevel): string {
  switch (level) {
    case "critical":
      return "CRITICAL";
    case "high":
      return "HIGH";
    case "medium":
      return "MEDIUM";
    case "low":
      return "LOW";
  }
}
