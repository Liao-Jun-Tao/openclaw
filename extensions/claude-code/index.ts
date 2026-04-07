import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/plugin-entry";
import { resolveClaudeCodeConfig } from "./src/config.js";
import { createBashTool } from "./src/tools/bash-tool.js";
import { createFileEditTool } from "./src/tools/file-edit-tool.js";
import { createFileReadTool } from "./src/tools/file-read-tool.js";
import { createGlobTool } from "./src/tools/glob-tool.js";
import { createGrepTool } from "./src/tools/grep-tool.js";
import { createCompactTool } from "./src/context/compact.js";
import { createProgressTool, createBudgetTool } from "./src/progress.js";
import { createThinkingTool } from "./src/thinking.js";

export default definePluginEntry({
  id: "claude-code",
  name: "Claude Code Compatibility",
  description:
    "Claude Code CLI tools and commands for OpenClaw. Provides bash, read, edit, glob, grep tools plus thinking, compaction, and progress tracking.",
  register(api) {
    const config = resolveClaudeCodeConfig(api.pluginConfig);

<<<<<<< Updated upstream
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

    // Claude Code 增强工具
    api.registerTool((ctx) => createCompactTool(), { name: "compact" });
    api.registerTool((ctx) => createProgressTool(), { name: "progress" });
    api.registerTool((ctx) => createBudgetTool(), { name: "budget" });
    api.registerTool((ctx) => createThinkingTool(), { name: "think" });

    // Add system prompt guidance
    api.addToSystemPrompt(`
## Claude Code Compatibility Plugin

This agent has access to Claude Code compatible tools:

### Core Tools
- \`bash\` - Execute shell commands (git, npm, build tools, etc.)
- \`read\` - Read file contents with offset/limit support
- \`edit\` - Make targeted file edits using oldText/newText replacement
- \`glob\` - Find files by glob patterns (e.g., **/*.ts)
- \`grep\` - Search file contents with regex support

### Claude Code 增强工具
- \`compact\` - Compact conversation context to reduce token usage
- \`progress\` - View conversation progress and statistics
- \`budget\` - View token budget status and remaining space
- \`think\` - Enable thinking mode to show AI reasoning

### Thinking Levels
- \`off\` - No thinking (fastest)
- \`low\` - 2,000 tokens (~2 seconds)
- \`medium\` - 8,000 tokens (~8 seconds)
- \`high\` - 15,000 tokens (~15 seconds)
- \`ultra\` - 30,000 tokens (~30 seconds, Haiku 4.5+ only)

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
=======
    api.registerTool(createBashTool(config) as AnyAgentTool);
    api.registerTool(createFileReadTool(config) as AnyAgentTool);
    api.registerTool(createFileEditTool(config) as AnyAgentTool);
    api.registerTool(createGlobTool(config) as AnyAgentTool);
    api.registerTool(createGrepTool(config) as AnyAgentTool);
    api.registerTool(createCompactTool() as AnyAgentTool);
    api.registerTool(createProgressTool() as AnyAgentTool);
    api.registerTool(createBudgetTool() as AnyAgentTool);
    api.registerTool(createThinkingTool() as AnyAgentTool);
>>>>>>> Stashed changes
  },
});
