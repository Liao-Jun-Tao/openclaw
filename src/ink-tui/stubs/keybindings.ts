import { useCallback } from "react";

export type KeybindingAction = string;

export function useKeybinding(
  _action: KeybindingAction,
  _handler: () => void,
  _opts?: { enabled?: boolean },
): void {}

export function useKeybindings(): Map<string, { key: string; description: string }> {
  return new Map();
}
