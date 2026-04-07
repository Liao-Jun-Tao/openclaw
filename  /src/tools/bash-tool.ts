import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";
import { Type } from "@sinclair/typebox";
import type { ToolUseContext } from "openclaw/plugin-sdk/channel-contract.js";
import { readStringParam, type ToolInputError } from "openclaw/plugin-sdk/param-readers.js";
import { resolveClaudeCodeConfig, type ClaudeCodeConfig } from "../config.js";

const BASH_TOOL_NAME = "bash";
const BASH_TOOL_DESCRIPTION =
  "Execute shell commands. Use for git operations, file navigation, running scripts, and system operations.";

const BashInputSchema = Type.Object({
  command: Type.String({
    description: "The shell command to execute",
  }),
  context: Type.Optional(
    Type.Object({
      cwd: Type.Optional(Type.String({ description: "Working directory for the command" })),
      timeoutMs: Type.Optional(
        Type.Number({ description: "Timeout in milliseconds", minimum: 1000, maximum: 600000 }),
      ),
    }),
  ),
});

type BashInput = Type.Input<typeof BashInputSchema>;
type BashOutput = Type.Output<typeof BashInputSchema>;

// Security: commands that are never allowed regardless of config
const DENY_LISTED_COMMANDS = new Set([
  ":",
  "alias",
  "bind",
  "builtin",
  "declare",
  "dirs",
  "disable",
  "enable",
  "eval",
  "exec",
  "export",
  "history",
  "local",
  "logout",
  "popd",
  "pushd",
  "read",
  "readonly",
  "set",
  "shopt",
  "source",
  "type",
  "typeset",
  "ulimit",
  "unalias",
  "unset",
]);

function isDeniedCommand(command: string): boolean {
  const firstToken = command.trim().split(/\s+/)[0]?.toLowerCase();
  return firstToken ? DENY_LISTED_COMMANDS.has(firstToken) : false;
}

function createBashToolResult(
  output: string,
  exitCode: number | null,
  durationMs: number,
  config: ClaudeCodeConfig,
): AgentToolResult {
  const timedOut = false; // Would need proper tracking
  const status = exitCode === 0 ? "completed" : "failed";

  return {
    ok: exitCode === 0 || exitCode === null,
    status,
    result: {
      type: "text",
      text: output || "(no output)",
    },
    metadata: {
      exitCode,
      durationMs,
      timedOut,
    },
  };
}

export function createBashTool(params: {
  context: ToolUseContext;
  config: ClaudeCodeConfig;
}): AgentTool {
  const { config } = params;

  const maxTimeout = config.maxBashTimeoutMs ?? 300000;

  return {
    name: BASH_TOOL_NAME,
    description: BASH_TOOL_DESCRIPTION,

    inputSchema: BashInputSchema,

    async handle(
      params: Record<string, unknown>,
      context: ToolUseContext,
    ): Promise<AgentToolResult> {
      const startTime = Date.now();

      try {
        // Parse input
        const command = readStringParam(params, "command", { required: true });
        if (!command) {
          throw new Error("command is required");
        }

        // Security check: deny-listed commands
        if (isDeniedCommand(command)) {
          return {
            ok: false,
            status: "rejected",
            result: {
              type: "text",
              text: `Command '${command.split(/\s+/)[0]}' is not allowed for security reasons.`,
            },
          };
        }

        // Check allowed commands list
        if (config.allowedCommands && config.allowedCommands.length > 0) {
          const firstToken = command.trim().split(/\s+/)[0]?.toLowerCase();
          if (firstToken && !config.allowedCommands.some((c) => c.toLowerCase() === firstToken)) {
            return {
              ok: false,
              status: "rejected",
              result: {
                type: "text",
                text: `Command '${firstToken}' is not in the allowed commands list.`,
              },
            };
          }
        }

        // Get timeout
        const contextObj = params.context as { cwd?: string; timeoutMs?: number } | undefined;
        const timeoutMs = Math.min(contextObj?.timeoutMs ?? maxTimeout, maxTimeout);

        // Execute command
        const result = await executeBashCommand(command, {
          cwd: contextObj?.cwd,
          timeoutMs,
          sandbox: config.sandboxMode ?? false,
        });

        const durationMs = Date.now() - startTime;
        return createBashToolResult(result.output, result.exitCode, durationMs, config);
      } catch (error) {
        const durationMs = Date.now() - startTime;
        const message = error instanceof Error ? error.message : String(error);
        return {
          ok: false,
          status: "failed",
          result: {
            type: "text",
            text: `Bash tool error: ${message}`,
          },
          metadata: {
            durationMs,
          },
        };
      }
    },
  };
}

async function executeBashCommand(
  command: string,
  options: {
    cwd?: string;
    timeoutMs?: number;
    sandbox?: boolean;
  },
): Promise<{ output: string; exitCode: number | null }> {
  const { cwd, timeoutMs = 300000 } = options;

  return new Promise((resolve) => {
    const proc = Bun.spawn(["/bin/zsh", "-c", command], {
      cwd: cwd || process.cwd(),
      timeout: timeoutMs,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.then((result) => {
      const output = stdout + (stderr ? `\n${stderr}` : "");
      resolve({
        output: output.slice(0, 100000), // Cap at 100k chars
        exitCode: result.exitCode,
      });
    });

    proc.catch((error) => {
      resolve({
        output: `Execution error: ${error.message}`,
        exitCode: 1,
      });
    });
  });
}

// Tool definition for registration
export const bashToolDefinition = {
  name: BASH_TOOL_NAME,
  description: BASH_TOOL_DESCRIPTION,
  inputSchema: BashInputSchema,
};
