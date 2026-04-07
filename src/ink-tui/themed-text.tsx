import React, { type ReactNode } from "react";
import Text from "./ink/components/Text.js";
import type { Color, Styles } from "./ink/styles.js";
import { useResolvedTheme } from "./theme-provider.js";
import type { Theme } from "./theme.js";

export type Props = {
  color?: keyof Theme | Color;
  backgroundColor?: keyof Theme | Color;
  dimColor?: boolean;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  inverse?: boolean;
  wrap?: Styles["textWrap"];
  children?: ReactNode;
};

function resolveColor(color: keyof Theme | Color | undefined, theme: Theme): Color | undefined {
  if (!color) {
    return undefined;
  }
  if (
    color.startsWith("rgb(") ||
    color.startsWith("#") ||
    color.startsWith("ansi256(") ||
    color.startsWith("ansi:")
  ) {
    return color as Color;
  }
  return theme[color as keyof Theme] as Color;
}

export default function ThemedText({
  color,
  backgroundColor,
  dimColor = false,
  bold = false,
  italic = false,
  underline = false,
  strikethrough = false,
  inverse = false,
  wrap = "wrap",
  children,
}: Props) {
  const theme = useResolvedTheme();
  const resolvedColor = dimColor ? (theme.inactive as Color) : resolveColor(color, theme);
  const resolvedBackgroundColor = backgroundColor ? (theme[backgroundColor] as Color) : undefined;

  return (
    <Text
      color={resolvedColor}
      backgroundColor={resolvedBackgroundColor}
      bold={bold}
      italic={italic}
      underline={underline}
      strikethrough={strikethrough}
      inverse={inverse}
      wrap={wrap}
    >
      {children}
    </Text>
  );
}
