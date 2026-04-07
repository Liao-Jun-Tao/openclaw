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
    "Claude Code CLI tools and commands for OpenClaw. Provides bash, read, edit, glob, grep tools plus commands like /commit, /review, /coding, /think and more.",
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
      thinkingLevel: {
        type: "string",
        enum: ["off", "low", "medium", "high"],
        default: "medium",
      },
    },
  },
  register(api) {
    const config = resolveClaudeCodeConfig(api.pluginConfig);

    // Register tools
    api.registerTool(
      (ctx) => createBashTool({ context: ctx, config }),
      { name: "bash" },
    );

    api.registerTool(
      (ctx) => createFileReadTool({ context: ctx, config }),
      { name: "read" },
    );

    api.registerTool(
      (ctx) => createFileEditTool({ context: ctx, config }),
      { name: "edit" },
    );

    api.registerTool(
      (ctx) => createGlobTool({ context: ctx, config }),
      { name: "glob" },
    );

    api.registerTool(
      (ctx) => createGrepTool({ context: ctx, config }),
      { name: "grep" },
    );

    // Add system prompt guidance
    api.addToSystemPrompt(`
## Claude Code Compatibility Plugin

This agent has access to Claude Code compatible tools:

### Tools
- \`bash\` - Execute shell commands (git, npm, build tools, etc.)
- \`read\` - Read file contents with offset/limit support
- \`edit\` - Make targeted file edits using oldText/newText replacement
- \`glob\` - Find files by glob patterns (e.g., **/*.ts)
- \`grep\` - Search file contents with regex support

### Commands (prefix with /)
- \`/commit\` - Create git commits with smart message generation
- \`/review\` - Review code changes with structured feedback
- \`/diff\` - View git diffs in various formats
- \`/branch\` - Manage git branches
- \`/coding\` - Spawn a coding agent with visible thinking
- \`/think\` - Show reasoning process
- \`/model\` - Switch AI models
- \`/config\` - Manage configuration
- \`/compact\` - Reduce context length
- \`/session\` - Manage sessions
- \`/help <topic>\` - Get help

### Coding Agent Features
- Use \`/coding --thinking high <task>\` for complex tasks
- Use \`/think <question>\` to see reasoning
- Use \`/brief <task>\` for quick simple tasks

### Configuration
Config in .openclaw.json:
{
  "plugins": {
    "claude-code": {
      "sandboxMode": false,
      "readonlyMode": false,
      "thinkingLevel": "medium"
    }
  }
}
`);
  },
});
