import React from "react";
import { createRoot } from "./ink.tsx";
import { REPL } from "./screens/REPL.js";

export type InkTuiOptions = {
  url: string;
  token?: string;
  password?: string;
  sessionKey?: string;
  message?: string;
};

export async function runInkTui(options: InkTuiOptions): Promise<void> {
  if (!process.stdin.isTTY) {
    throw new Error(
      "tui2 requires an interactive terminal (TTY). Run this command directly in your terminal, not through a pipe.",
    );
  }

  const sessionKey = options.sessionKey ?? "main";

  const root = await createRoot({
    exitOnCtrlC: false,
  });

  root.render(
    <REPL
      url={options.url}
      token={options.token}
      password={options.password}
      sessionKey={sessionKey}
      initialMessage={options.message}
    />,
  );

  await root.waitUntilExit();
}
