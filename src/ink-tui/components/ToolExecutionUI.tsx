import React, { useState, useEffect } from "react";
import Box from "../ink/components/Box.js";
import Text from "../ink/components/Text.js";

type ToolState = {
  id: string;
  name: string;
  phase: "start" | "update" | "result";
  args?: unknown;
  partialResult?: unknown;
  result?: unknown;
  isError?: boolean;
};

type Props = {
  tool: ToolState;
  expanded?: boolean;
};

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function SpinnerChar() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setFrame((p) => (p + 1) % SPINNER.length), 80);
    return () => clearInterval(timer);
  }, []);
  return <Text color="yellow">{SPINNER[frame]}</Text>;
}

function formatToolResult(result: unknown): string {
  if (typeof result === "string") {
    return result;
  }
  if (result === null || result === undefined) {
    return "";
  }
  try {
    const s = JSON.stringify(result, null, 2);
    return s.length > 500 ? s.slice(0, 500) + "..." : s;
  } catch {
    return String(result);
  }
}

export function ToolExecutionUI({ tool, expanded = false }: Props) {
  const isRunning = tool.phase !== "result";
  const icon = isRunning ? null : tool.isError ? "✗" : "✓";
  const iconColor = tool.isError ? "red" : "green";

  return (
    <Box flexDirection="column" paddingLeft={1}>
      <Box>
        {isRunning ? <SpinnerChar /> : <Text color={iconColor}>{icon}</Text>}
        <Text> </Text>
        <Text bold>{tool.name}</Text>
        {isRunning && <Text dimColor> running...</Text>}
      </Box>

      {expanded && tool.args && (
        <Box paddingLeft={3} marginTop={0}>
          <Text dimColor wrap="wrap">
            {formatToolResult(tool.args)}
          </Text>
        </Box>
      )}

      {tool.phase === "result" && tool.result && expanded && (
        <Box paddingLeft={3}>
          <Text color={tool.isError ? "red" : undefined} wrap="wrap">
            {formatToolResult(tool.result)}
          </Text>
        </Box>
      )}
    </Box>
  );
}
