import type { ReactNode } from "react";
import React from "react";
import inkRender, {
  type Instance,
  createRoot as inkCreateRoot,
  type RenderOptions,
  type Root,
} from "./ink/root.js";
import { ThemeProvider } from "./theme-provider.js";

export type { RenderOptions, Instance, Root };

export async function render(
  node: ReactNode,
  options?: NodeJS.WriteStream | RenderOptions,
): Promise<Instance> {
  return inkRender(<ThemeProvider>{node}</ThemeProvider>, options);
}

export async function createRoot(options?: RenderOptions): Promise<Root> {
  const root = await inkCreateRoot(options);
  return {
    ...root,
    render: (node: ReactNode) => root.render(<ThemeProvider>{node}</ThemeProvider>),
  };
}

// Re-export Ink primitives
export { Ansi } from "./ink/Ansi.js";
export type { Props as AppProps } from "./ink/components/AppContext.js";
export type { Props as BoxProps } from "./ink/components/Box.js";
export { default as Box } from "./ink/components/Box.js";
export type { ButtonState, Props as ButtonProps } from "./ink/components/Button.js";
export { default as Button } from "./ink/components/Button.js";
export type { Props as LinkProps } from "./ink/components/Link.js";
export { default as Link } from "./ink/components/Link.js";
export type { Props as NewlineProps } from "./ink/components/Newline.js";
export { default as Newline } from "./ink/components/Newline.js";
export { NoSelect } from "./ink/components/NoSelect.js";
export { RawAnsi } from "./ink/components/RawAnsi.js";
export { default as Spacer } from "./ink/components/Spacer.js";
export type { Props as StdinProps } from "./ink/components/StdinContext.js";
export type { Props as TextProps } from "./ink/components/Text.js";
export { default as Text } from "./ink/components/Text.js";
export type { DOMElement } from "./ink/dom.js";
export { ClickEvent } from "./ink/events/click-event.js";
export { EventEmitter } from "./ink/events/emitter.js";
export { Event } from "./ink/events/event.js";
export type { Key } from "./ink/events/input-event.js";
export { InputEvent } from "./ink/events/input-event.js";
export type { TerminalFocusEventType } from "./ink/events/terminal-focus-event.js";
export { TerminalFocusEvent } from "./ink/events/terminal-focus-event.js";
export { FocusManager } from "./ink/focus.js";
export type { FlickerReason } from "./ink/frame.js";
export { useAnimationFrame } from "./ink/hooks/use-animation-frame.js";
export { default as useApp } from "./ink/hooks/use-app.js";
export { default as useInput } from "./ink/hooks/use-input.js";
export { useAnimationTimer, useInterval } from "./ink/hooks/use-interval.js";
export { useSelection } from "./ink/hooks/use-selection.js";
export { default as useStdin } from "./ink/hooks/use-stdin.js";
export { useTabStatus } from "./ink/hooks/use-tab-status.js";
export { useTerminalFocus } from "./ink/hooks/use-terminal-focus.js";
export { useTerminalTitle } from "./ink/hooks/use-terminal-title.js";
export { useTerminalViewport } from "./ink/hooks/use-terminal-viewport.js";
export { default as measureElement } from "./ink/measure-element.js";
export { supportsTabStatus } from "./ink/termio/osc.js";
export { default as wrapText } from "./ink/wrap-text.js";

// Theme
export { getTheme, resolveColor, type Theme, type ThemeName, type ThemeSetting } from "./theme.js";
export { ThemeProvider, useTheme, useThemeName, useResolvedTheme } from "./theme-provider.js";
export { default as ThemedBox } from "./themed-box.js";
export type { Props as ThemedBoxProps } from "./themed-box.js";
export { default as ThemedText } from "./themed-text.js";
export type { Props as ThemedTextProps } from "./themed-text.js";
