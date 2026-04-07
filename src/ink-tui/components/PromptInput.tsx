import React, { useState, useCallback } from "react";
import Box from "../ink/components/Box.js";
import Text from "../ink/components/Text.js";
import useInput from "../ink/hooks/use-input.js";
import ThemedBox from "../themed-box.js";
import ThemedText from "../themed-text.js";

type Props = {
  onSubmit: (text: string) => void;
  isDisabled?: boolean;
  placeholder?: string;
};

export function PromptInput({ onSubmit, isDisabled, placeholder }: Props) {
  const [value, setValue] = useState("");
  const [cursorPos, setCursorPos] = useState(0);

  useInput(
    useCallback(
      (
        input: string,
        key: {
          return?: boolean;
          backspace?: boolean;
          delete?: boolean;
          leftArrow?: boolean;
          rightArrow?: boolean;
          ctrl?: boolean;
        },
      ) => {
        if (isDisabled) {
          return;
        }

        if (key.return) {
          const trimmed = value.trim();
          if (trimmed) {
            onSubmit(trimmed);
            setValue("");
            setCursorPos(0);
          }
          return;
        }

        if (key.backspace || key.delete) {
          if (cursorPos > 0) {
            setValue((prev) => prev.slice(0, cursorPos - 1) + prev.slice(cursorPos));
            setCursorPos((prev) => prev - 1);
          }
          return;
        }

        if (key.leftArrow) {
          setCursorPos((prev) => Math.max(0, prev - 1));
          return;
        }

        if (key.rightArrow) {
          setCursorPos((prev) => Math.min(value.length, prev + 1));
          return;
        }

        if (key.ctrl) {
          return;
        }

        if (input) {
          setValue((prev) => prev.slice(0, cursorPos) + input + prev.slice(cursorPos));
          setCursorPos((prev) => prev + input.length);
        }
      },
      [value, cursorPos, isDisabled, onSubmit],
    ),
  );

  const displayText = value || placeholder || "";
  const isEmpty = !value;

  return (
    <ThemedBox
      borderStyle="single"
      borderColor={isDisabled ? "promptBorder" : "claude"}
      paddingLeft={1}
      paddingRight={1}
    >
      <ThemedText color="claude" bold>
        {"  "}❯{"  "}
      </ThemedText>
      <Text dimColor={isEmpty || isDisabled}>{displayText}</Text>
      {!isDisabled && <Text inverse> </Text>}
    </ThemedBox>
  );
}
