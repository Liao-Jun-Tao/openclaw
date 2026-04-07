import type { Command } from "commander";
import { defaultRuntime } from "../runtime.js";
import { formatDocsLink } from "../terminal/links.js";
import { theme } from "../terminal/theme.js";

export function registerTui2Cli(program: Command) {
  program
    .command("tui2")
    .description("Open the React+Ink TUI connected to the Gateway (experimental)")
    .option("--url <url>", "Gateway WebSocket URL")
    .option("--token <token>", "Gateway token (if required)")
    .option("--password <password>", "Gateway password (if required)")
    .option("--session <key>", 'Session key (default: "main")')
    .option("--message <text>", "Send an initial message after connecting")
    .addHelpText(
      "after",
      () => `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/tui", "docs.openclaw.ai/cli/tui")}\n`,
    )
    .action(async (opts) => {
      try {
        const { resolveGatewayConnection } = await import("../tui/gateway-chat.js");

        const connection = await resolveGatewayConnection({
          url: opts.url as string | undefined,
          token: opts.token as string | undefined,
          password: opts.password as string | undefined,
        });

        const { runInkTui } = await import("../ink-tui/main.js");
        await runInkTui({
          url: connection.url,
          token: connection.token,
          password: connection.password,
          sessionKey: opts.session as string | undefined,
          message: opts.message as string | undefined,
        });
      } catch (err) {
        defaultRuntime.error(String(err));
        defaultRuntime.exit(1);
      }
    });
}
