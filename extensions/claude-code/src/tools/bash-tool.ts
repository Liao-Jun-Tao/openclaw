import { Type } from "@sinclair/typebox";
import { readStringParam } from "openclaw/plugin-sdk/param-readers";
import { buildTool } from "../build-tool.js";
import type { ClaudeCodeConfig } from "../config.js";
import { textResult } from "../tool-result.js";

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

const BashToolParameters = Type.Object(
  {
    command: Type.String({ description: "The shell command to execute" }),
    cwd: Type.Optional(Type.String({ description: "Working directory for the command" })),
    timeoutMs: Type.Optional(
      Type.Number({
        description: "Timeout in milliseconds",
        minimum: 1000,
        maximum: 600000,
      }),
    ),
  },
  { additionalProperties: false },
);

export function createBashTool(config: ClaudeCodeConfig) {
  const maxTimeout = config.maxBashTimeoutMs ?? 300000;

  return buildTool({
    name: "bash",
    description:
      "Execute shell commands. Use for git operations, file navigation, running scripts, and system operations.",
    parameters: BashToolParameters,
    isDestructive: true,
    isConcurrencySafe: false,
    isReadOnly: false,
    interruptBehavior: "cancel",

    getActivityDescription(input) {
      const cmd = input?.command;
      if (typeof cmd !== "string") {
        return null;
      }
      const short = cmd.length > 60 ? cmd.slice(0, 57) + "..." : cmd;
      return `Running: ${short}`;
    },

    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const startTime = Date.now();
      try {
        const command = readStringParam(rawParams, "command", { required: true });
        if (!command) {
          throw new Error("command is required");
        }

        if (isDeniedCommand(command)) {
          return textResult(
            `Command '${command.split(/\s+/)[0]}' is not allowed for security reasons.`,
          );
        }

        if (config.allowedCommands && config.allowedCommands.length > 0) {
          const firstToken = command.trim().split(/\s+/)[0]?.toLowerCase();
          if (firstToken && !config.allowedCommands.some((c) => c.toLowerCase() === firstToken)) {
            return textResult(`Command '${firstToken}' is not in the allowed commands list.`);
          }
        }

        const cwd = rawParams.cwd as string | undefined;
        const timeoutMs = Math.min((rawParams.timeoutMs as number) ?? maxTimeout, maxTimeout);

        const result = await executeBashCommand(command, { cwd, timeoutMs });
        const durationMs = Date.now() - startTime;
        const output = result.output || "(no output)";
        const prefix = result.exitCode === 0 ? "" : `[exit code ${result.exitCode}]\n`;
        return textResult(`${prefix}${output}\n(${durationMs}ms)`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return textResult(`Bash error: ${message}`);
      }
    },
  });
}

async function executeBashCommand(
  command: string,
  options: { cwd?: string; timeoutMs?: number },
): Promise<{ output: string; exitCode: number | null }> {
  const { cwd, timeoutMs = 300000 } = options;
  const { execSync } = await import("node:child_process");

  try {
    const stdout = execSync(command, {
      cwd: cwd || process.cwd(),
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });
    return { output: (stdout ?? "").slice(0, 100_000), exitCode: 0 };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; status?: number; message?: string };
    const output = [error.stdout, error.stderr].filter(Boolean).join("\n") || error.message || "";
    return { output: output.slice(0, 100_000), exitCode: error.status ?? 1 };
  }
}
