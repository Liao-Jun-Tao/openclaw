import { Type } from "@sinclair/typebox";
import { OpenClawPluginConfig } from "openclaw/plugin-sdk/config-schema.js";

export const ClaudeCodeConfigSchema = Type.Optional(
  Type.Object({
    sandboxMode: Type.Optional(
      Type.Boolean({ description: "Run bash commands in isolated sandbox environment" }),
    ),
    allowedCommands: Type.Optional(
      Type.Array(Type.String(), { description: "Comma-separated list of allowed bash commands" }),
    ),
    readonlyMode: Type.Optional(
      Type.Boolean({ description: "Disable file editing tools - read-only access" }),
    ),
    maxBashTimeoutMs: Type.Optional(
      Type.Number({
        description: "Maximum bash command timeout in milliseconds",
        minimum: 1000,
        maximum: 600000,
      }),
    ),
  }),
);

export type ClaudeCodeConfig = Type.Input<typeof ClaudeCodeConfigSchema>;

export function resolveClaudeCodeConfig(
  pluginConfig: OpenClawPluginConfig,
): ClaudeCodeConfig {
  if (!pluginConfig || typeof pluginConfig !== "object") {
    return {};
  }
  return pluginConfig as ClaudeCodeConfig;
}
