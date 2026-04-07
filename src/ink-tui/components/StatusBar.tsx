import React from "react";
import type { ConnectionStatus, StreamingStatus } from "../bridge/types.js";
import Box from "../ink/components/Box.js";
import Text from "../ink/components/Text.js";
import ThemedBox from "../themed-box.js";
import ThemedText from "../themed-text.js";

type Props = {
  connectionStatus: ConnectionStatus;
  streamingStatus: StreamingStatus;
  sessionKey?: string;
  model?: string;
};

const connectionColors: Record<ConnectionStatus, string> = {
  connected: "success",
  connecting: "warning",
  disconnected: "error",
  error: "error",
};

export function StatusBar({ connectionStatus, streamingStatus, sessionKey, model }: Props) {
  const isConnected = connectionStatus === "connected";

  return (
    <ThemedBox
      borderStyle="single"
      borderColor="promptBorder"
      flexDirection="row"
      alignItems="center"
      paddingLeft={1}
      paddingRight={1}
    >
      <ThemedText color={isConnected ? "success" : "error"}>{isConnected ? "●" : "○"}</ThemedText>
      <ThemedText dimColor> </ThemedText>
      <ThemedText color={connectionColors[connectionStatus]}>{connectionStatus}</ThemedText>

      <ThemedText dimColor> │ </ThemedText>

      {streamingStatus !== "idle" && (
        <>
          <ThemedText color="claude" italic>
            {streamingStatus}
          </ThemedText>
          <ThemedText dimColor> │ </ThemedText>
        </>
      )}

      {sessionKey && (
        <>
          <ThemedText dimColor>{sessionKey.slice(0, 16)}</ThemedText>
          <ThemedText dimColor> │ </ThemedText>
        </>
      )}

      {model && (
        <>
          <ThemedText dimColor>{model}</ThemedText>
          <ThemedText dimColor> │ </ThemedText>
        </>
      )}

      <Box flexGrow={1} />

      <ThemedText dimColor italic>
        Ctrl+C: abort
      </ThemedText>
    </ThemedBox>
  );
}
