import React, { useCallback, useEffect, useRef, useState } from "react";
import { useGatewayConnection } from "../bridge/hooks/useGatewayConnection.js";
import { useMessages } from "../bridge/hooks/useMessages.js";
import type { SessionInfo } from "../bridge/types.js";
import { MessageBubble } from "../components/MessageBubble.js";
import { PromptInput } from "../components/PromptInput.js";
import { StatusBar } from "../components/StatusBar.js";
import { StreamingResponse } from "../components/StreamingResponse.js";
import { ToolDisplay } from "../components/ToolDisplay.js";
import Box from "../ink/components/Box.js";
import Text from "../ink/components/Text.js";
import useApp from "../ink/hooks/use-app.js";
import useInput from "../ink/hooks/use-input.js";
import { ThemeProvider } from "../theme-provider.js";
import ThemedBox from "../themed-box.js";
import ThemedText from "../themed-text.js";

type REPLProps = {
  url: string;
  token?: string;
  password?: string;
  sessionKey: string;
  initialMessage?: string;
};

function REPLInner({ url, token, password, sessionKey, initialMessage }: REPLProps) {
  const { exit } = useApp();
  const [sessionInfo, setSessionInfo] = useState<Partial<SessionInfo>>({});
  const [notifications, setNotifications] = useState<string[]>([]);
  const lastCtrlCRef = useRef(0);
  const initialMessageSent = useRef(false);

  const {
    messages,
    streamingText,
    thinkingText,
    activeTools,
    isStreaming,
    addUserMessage,
    handleBridgeEvent,
    loadHistory: setLoadedHistory,
  } = useMessages();

  const { connectionStatus, streamingStatus, sendMessage, abortRun, loadHistory } =
    useGatewayConnection({
      url,
      token,
      password,
      sessionKey,
      onEvent: handleBridgeEvent,
      onBtw: (params) => {
        setNotifications((prev) => [...prev.slice(-4), params.text]);
      },
      onHistoryLoaded: setLoadedHistory,
      onSessionInfoChange: (info) => {
        setSessionInfo((prev) => ({ ...prev, ...info }));
      },
    });

  useEffect(() => {
    if (connectionStatus === "connected") {
      loadHistory(50).catch(() => {});
    }
  }, [connectionStatus, loadHistory]);

  useEffect(() => {
    if (connectionStatus === "connected" && initialMessage && !initialMessageSent.current) {
      initialMessageSent.current = true;
      addUserMessage(initialMessage);
      sendMessage(initialMessage).catch(() => {});
    }
  }, [connectionStatus, initialMessage, sendMessage, addUserMessage]);

  const handleSubmit = useCallback(
    async (text: string) => {
      if (connectionStatus !== "connected") {
        return;
      }
      addUserMessage(text);
      await sendMessage(text);
    },
    [connectionStatus, addUserMessage, sendMessage],
  );

  useInput(
    useCallback(
      (_input: string, key: { ctrl?: boolean; escape?: boolean }) => {
        if (key.ctrl && _input === "c") {
          if (isStreaming) {
            abortRun().catch(() => {});
            return;
          }
          const now = Date.now();
          if (now - lastCtrlCRef.current < 500) {
            exit();
          }
          lastCtrlCRef.current = now;
        }
        if (key.escape && isStreaming) {
          abortRun().catch(() => {});
        }
      },
      [isStreaming, abortRun, exit],
    ),
  );

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <ThemedBox
        paddingLeft={1}
        paddingRight={1}
        marginBottom={0}
        borderBottomColor="promptBorder"
        borderBottomWidth={1}
        paddingTop={1}
        paddingBottom={1}
      >
        <ThemedText color="claude" bold>
          ◈ OpenClaw
        </ThemedText>
        <ThemedText dimColor> — Claude Code UI</ThemedText>
      </ThemedBox>

      {/* Messages area */}
      <Box flexDirection="column" flexGrow={1} paddingLeft={1} paddingRight={1} overflowY="scroll">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        <ToolDisplay tools={activeTools} />

        <StreamingResponse
          text={streamingText}
          thinkingText={thinkingText}
          isStreaming={isStreaming}
        />

        {notifications.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            {notifications.map((n, i) => (
              <ThemedText key={i} color="warning" italic>
                {n}
              </ThemedText>
            ))}
          </Box>
        )}
      </Box>

      {/* Input */}
      <Box marginTop={1} paddingLeft={1} paddingRight={1}>
        <PromptInput
          onSubmit={handleSubmit}
          isDisabled={connectionStatus !== "connected" || isStreaming}
          placeholder={
            connectionStatus !== "connected"
              ? `${connectionStatus}...`
              : isStreaming
                ? "Waiting for response..."
                : "Type a message..."
          }
        />
      </Box>

      {/* Status bar */}
      <StatusBar
        connectionStatus={connectionStatus}
        streamingStatus={streamingStatus}
        sessionKey={sessionKey}
        model={sessionInfo.model}
      />
    </Box>
  );
}

export function REPL(props: REPLProps) {
  return (
    <ThemeProvider>
      <REPLInner {...props} />
    </ThemeProvider>
  );
}
