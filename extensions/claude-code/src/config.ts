export interface ClaudeCodeConfig {
  sandboxMode?: boolean;
  allowedCommands?: string[];
  readonlyMode?: boolean;
  maxBashTimeoutMs?: number;
  thinkingLevel?: "off" | "low" | "medium" | "high";
}

export function resolveClaudeCodeConfig(pluginConfig?: Record<string, unknown>): ClaudeCodeConfig {
  if (!pluginConfig || typeof pluginConfig !== "object") {
    return {};
  }
  return pluginConfig as ClaudeCodeConfig;
}
