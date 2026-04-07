import React, { useCallback, useState } from "react";
import Box from "../ink/components/Box.js";
import Text from "../ink/components/Text.js";
import useInput from "../ink/hooks/use-input.js";

type PermissionRequest = {
  id: string;
  toolName: string;
  description: string;
  args?: Record<string, unknown>;
};

type Props = {
  request: PermissionRequest;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
};

export function PermissionDialog({ request, onApprove, onDeny }: Props) {
  const [selected, setSelected] = useState<"allow" | "deny">("allow");

  useInput(
    useCallback(
      (
        _input: string,
        key: { return?: boolean; leftArrow?: boolean; rightArrow?: boolean; tab?: boolean },
      ) => {
        if (key.leftArrow || key.rightArrow || key.tab) {
          setSelected((prev) => (prev === "allow" ? "deny" : "allow"));
        }
        if (key.return) {
          if (selected === "allow") {
            onApprove(request.id);
          } else {
            onDeny(request.id);
          }
        }
        if (_input === "y" || _input === "Y") {
          onApprove(request.id);
        }
        if (_input === "n" || _input === "N") {
          onDeny(request.id);
        }
      },
      [selected, onApprove, onDeny, request.id],
    ),
  );

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="yellow"
      padding={1}
      marginBottom={1}
    >
      <Box marginBottom={1}>
        <Text bold color="yellow">
          ⚠ Permission Required
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text bold>{request.toolName}</Text>
        <Text>: {request.description}</Text>
      </Box>

      {request.args && Object.keys(request.args).length > 0 && (
        <Box flexDirection="column" marginBottom={1} paddingLeft={2}>
          {Object.entries(request.args).map(([key, value]) => (
            <Box key={key}>
              <Text dimColor>{key}: </Text>
              <Text>{String(value).slice(0, 100)}</Text>
            </Box>
          ))}
        </Box>
      )}

      <Box>
        <Box
          borderStyle={selected === "allow" ? "round" : undefined}
          borderColor="green"
          paddingLeft={1}
          paddingRight={1}
          marginRight={2}
        >
          <Text color="green" bold={selected === "allow"}>
            [Y] Allow
          </Text>
        </Box>
        <Box
          borderStyle={selected === "deny" ? "round" : undefined}
          borderColor="red"
          paddingLeft={1}
          paddingRight={1}
        >
          <Text color="red" bold={selected === "deny"}>
            [N] Deny
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
