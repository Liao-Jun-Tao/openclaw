import React from "react";
import type { Message } from "../bridge/types.js";
import Box from "../ink/components/Box.js";
import { NoSelect } from "../ink/components/NoSelect.js";
import Text from "../ink/components/Text.js";
import ThemedBox from "../themed-box.js";
import ThemedText from "../themed-text.js";

type Props = {
  message: Message;
};

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const text =
    typeof message.content === "string"
      ? message.content
      : (message.content as Array<{ type: string; text?: string }>)
          .filter((b) => b.type === "text")
          .map((b) => b.text ?? "")
          .join("");

  if (!text.trim()) {
    return null;
  }

  if (isUser) {
    return (
      <ThemedBox flexDirection="column" marginBottom={1}>
        <ThemedBox paddingTop={1}>
          <NoSelect>
            <Text dimColor>
              {"  "}⎺{"  "}
            </Text>
          </NoSelect>
          <ThemedText color="briefLabelYou" bold>
            You
          </ThemedText>
        </ThemedBox>
        <ThemedBox paddingLeft={2} paddingTop={1}>
          <Text wrap="wrap">{text}</Text>
        </ThemedBox>
      </ThemedBox>
    );
  }

  return (
    <ThemedBox flexDirection="column" marginBottom={1}>
      <ThemedBox paddingTop={1}>
        <NoSelect>
          <Text dimColor>
            {"  "}⎿{"  "}
          </Text>
        </NoSelect>
        <ThemedText color="claude" bold>
          Assistant
        </ThemedText>
      </ThemedBox>
      <Box flexDirection="column" flexShrink={1} flexGrow={1} paddingLeft={2} paddingTop={1}>
        <Box flexShrink={1} flexGrow={1}>
          <Text wrap="wrap">{text}</Text>
        </Box>
      </Box>
    </ThemedBox>
  );
}
