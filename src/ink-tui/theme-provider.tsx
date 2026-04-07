import React, { createContext, useContext, useState } from "react";
import { getTheme, type Theme, type ThemeName, type ThemeSetting } from "./theme.js";

const DEFAULT_THEME: ThemeName = "dark";

type ThemeContextValue = {
  themeSetting: ThemeSetting;
  setThemeSetting: (setting: ThemeSetting) => void;
  currentTheme: ThemeName;
};

const ThemeContext = createContext<ThemeContextValue>({
  themeSetting: DEFAULT_THEME,
  setThemeSetting: () => {},
  currentTheme: DEFAULT_THEME,
});

export function useTheme(): [ThemeName, Theme, ThemeSetting, (s: ThemeSetting) => void] {
  const ctx = useContext(ThemeContext);
  return [ctx.currentTheme, getTheme(ctx.currentTheme), ctx.themeSetting, ctx.setThemeSetting];
}

export function useThemeName(): ThemeName {
  return useContext(ThemeContext).currentTheme;
}

export function useResolvedTheme(): Theme {
  return getTheme(useContext(ThemeContext).currentTheme);
}

type Props = {
  children: React.ReactNode;
  initialTheme?: ThemeSetting;
};

export function ThemeProvider({ children, initialTheme = DEFAULT_THEME }: Props) {
  const [themeSetting, setThemeSetting] = useState<ThemeSetting>(initialTheme);
  const currentTheme: ThemeName = themeSetting === "auto" ? "dark" : themeSetting;

  return (
    <ThemeContext.Provider value={{ themeSetting, setThemeSetting, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
