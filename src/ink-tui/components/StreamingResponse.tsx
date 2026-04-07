import React, { useEffect, useState } from "react";
import Box from "../ink/components/Box.js";
import { NoSelect } from "../ink/components/NoSelect.js";
import Text from "../ink/components/Text.js";
import ThemedBox from "../themed-box.js";
import ThemedText from "../themed-text.js";

type Props = {
  text: string;
  thinkingText?: string;
  isStreaming: boolean;
};

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function SpinnerChar() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setFrame((p) => (p + 1) % SPINNER_FRAMES.length), 80);
    return () => clearInterval(timer);
  }, []);
  return <ThemedText color="claudeShimmer">{SPINNER_FRAMES[frame]}</ThemedText>;
}

export function StreamingResponse({ text, thinkingText, isStreaming }: Props) {
  if (!text && !thinkingText) {
    return null;
  }

  return (
    <ThemedBox flexDirection="column" marginBottom={1}>
      <ThemedBox paddingTop={1}>
        <NoSelect>
          <Text dimColor>
            {"  "}⎿ {"  "}
          </Text>
        </NoSelect>
        <ThemedText color="claude" bold>
          Assistant
        </ThemedText>
        {isStreaming && (
          <>
            <Text> </Text>
            <SpinnerChar />
          </>
        )}
      </ThemedBox>

      {thinkingText ? (
        <ThemedBox flexDirection="column" paddingLeft={2} paddingTop={1}>
          <ThemedText dimColor italic>
            ∴ Thinking: {thinkingText}
          </ThemedText>
        </ThemedBox>
      ) : null}

      {text ? (
        <Box flexDirection="column" flexShrink={1} flexGrow={1} paddingLeft={2} paddingTop={1}>
          <Box flexShrink={1} flexGrow={1}>
            <Text wrap="wrap">{text}</Text>
            {isStreaming && (
              <Text color="claudeShimmer" bold>
                ▌
              </Text>
            )}
          </Box>
        </Box>
      ) : null}
    </ThemedBox>
  );
}
