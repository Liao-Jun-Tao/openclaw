import React, { type PropsWithChildren, type Ref } from "react";
import Box from "./ink/components/Box.js";
import type { DOMElement } from "./ink/dom.js";
import type { Color, Styles } from "./ink/styles.js";
import { useResolvedTheme } from "./theme-provider.js";
import type { Theme } from "./theme.js";

type ThemedColorProps = {
  borderColor?: keyof Theme | Color;
  borderTopColor?: keyof Theme | Color;
  borderBottomColor?: keyof Theme | Color;
  borderLeftColor?: keyof Theme | Color;
  borderRightColor?: keyof Theme | Color;
  backgroundColor?: keyof Theme | Color;
};

type BaseStylesWithoutColors = Omit<
  Styles,
  | "textWrap"
  | "borderColor"
  | "borderTopColor"
  | "borderBottomColor"
  | "borderLeftColor"
  | "borderRightColor"
  | "backgroundColor"
>;

export type Props = BaseStylesWithoutColors &
  ThemedColorProps & {
    ref?: Ref<DOMElement>;
    tabIndex?: number;
    autoFocus?: boolean;
    onClick?: (event: unknown) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
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

export default function ThemedBox({
  borderColor,
  borderTopColor,
  borderBottomColor,
  borderLeftColor,
  borderRightColor,
  backgroundColor,
  children,
  ref,
  ...rest
}: Props) {
  const theme = useResolvedTheme();

  return (
    <Box
      ref={ref}
      borderColor={resolveColor(borderColor, theme)}
      borderTopColor={resolveColor(borderTopColor, theme)}
      borderBottomColor={resolveColor(borderBottomColor, theme)}
      borderLeftColor={resolveColor(borderLeftColor, theme)}
      borderRightColor={resolveColor(borderRightColor, theme)}
      backgroundColor={resolveColor(backgroundColor, theme)}
      {...rest}
    >
      {children}
    </Box>
  );
}
