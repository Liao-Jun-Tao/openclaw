import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry.js";
import { resolveClaudeCodeConfig } from "./src/config.js";
import { createBashTool } from "./src/tools/bash-tool.js";
import { createFileEditTool } from "./src/tools/file-edit-tool.js";
import { createFileReadTool } from "./src/tools/file-read-tool.js";
import { createGlobTool } from "./src/tools/glob-tool.js";
import { createGrepTool } from "./src/tools/grep-tool.js";

export default definePluginEntry({
  id: "claude-code",
  name: "Claude Code Compatibility",
  description:
    "Claude Code CLI tools for OpenClaw - bash execution, file editing, reading, glob patterns, and grep search.",
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      sandboxMode: { type: "boolean", default: false },
      allowedCommands: {
        type: "array",
        items: { type: "string" },
        default: [],
      },
      readonlyMode: { type: "boolean", default: false },
      maxBashTimeoutMs: {
        type: "integer",
        minimum: 1000,
        maximum: 600000,
        default: 300000,
      },
    },
  },
  register(api) {
    const config = resolveClaudeCodeConfig(api.pluginConfig);

    // Register bash tool
    api.registerTool((ctx) => createBashTool({ context: ctx, config }), { name: "bash" });

    // Register file read tool
    api.registerTool((ctx) => createFileReadTool({ context: ctx, config }), { name: "read" });

    // Register file edit tool
    api.registerTool((ctx) => createFileEditTool({ context: ctx, config }), { name: "edit" });

    // Register glob tool
    api.registerTool((ctx) => createGlobTool({ context: ctx, config }), { name: "glob" });

    // Register grep tool
    api.registerTool((ctx) => createGrepTool({ context: ctx, config }), { name: "grep" });

    // Add plugin system context
    api.addToSystemPrompt(
      `\n\n## Claude Code Tools\n\nThis agent has access to Claude Code compatible tools:\n- \`bash\`: Execute shell commands\n- \`read\`: Read file contents\n- \`edit\`: Edit files\n- \`glob\`: Find files by pattern\n- \`grep\`: Search file contents\n`,
    );
  },
});
