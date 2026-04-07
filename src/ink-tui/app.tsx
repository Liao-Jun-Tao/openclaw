import React from "react";
import Box from "./ink/components/Box.js";
import { REPL } from "./screens/REPL.js";

export type AppProps = {
  url: string;
  token?: string;
  password?: string;
  sessionKey: string;
  initialMessage?: string;
};

export function App({ url, token, password, sessionKey, initialMessage }: AppProps) {
  return (
    <Box flexDirection="column" width="100%" height="100%">
      <REPL
        url={url}
        token={token}
        password={password}
        sessionKey={sessionKey}
        initialMessage={initialMessage}
      />
    </Box>
  );
}
