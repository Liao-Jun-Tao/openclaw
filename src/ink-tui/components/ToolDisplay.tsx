import React, { useEffect, useState } from "react";
import Box from "../ink/components/Box.js";
import Text from "../ink/components/Text.js";
import ThemedText from "../themed-text.js";

type ToolState = {
  id: string;
  name: string;
  phase: "start" | "update" | "result";
  result?: unknown;
  isError?: boolean;
};

type Props = {
  tools: Map<string, ToolState>;
};

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function SpinnerChar() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setFrame((p) => (p + 1) % SPINNER.length), 80);
    return () => clearInterval(timer);
  }, []);
  return <ThemedText color="claudeShimmer">{SPINNER[frame]}</ThemedText>;
}

function formatResult(result: unknown): string {
  if (typeof result === "string") {
    return result;
  }
  if (result == null) {
    return "";
  }
  try {
    const s = JSON.stringify(result, null, 2);
    return s.length > 200 ? s.slice(0, 200) + "..." : s;
  } catch {
    return String(result);
  }
}

export function ToolDisplay({ tools }: Props) {
  if (tools.size === 0) {
    return null;
  }

  const entries = Array.from(tools.values());

  return (
    <Box flexDirection="column" marginBottom={1}>
      {entries.map((tool) => (
        <Box key={tool.id} flexDirection="column" paddingLeft={2}>
          <Box>
            {tool.phase === "result" ? (
              <ThemedText color={tool.isError ? "error" : "success"}>
                {tool.isError ? "✗" : "✓"}
              </ThemedText>
            ) : (
              <SpinnerChar />
            )}
            <ThemedText color="permission" bold>
              {" "}
              {tool.name}
            </ThemedText>
            <ThemedText dimColor>
              {tool.phase === "result" ? (tool.isError ? " (error)" : " (done)") : " (running)"}
            </ThemedText>
          </Box>
          {tool.phase === "result" && tool.result && (
            <Box paddingLeft={3} marginTop={0}>
              <Text dimColor wrap="wrap">
                {formatResult(tool.result)}
              </Text>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}
