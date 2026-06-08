"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useTheme } from "@/hooks/useTheme";

type ThemeContextValue = ReturnType<typeof useTheme>;

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, resolved, setTheme, toggle } = useTheme();
  const value = useMemo(
    () => ({ theme, resolved, setTheme, toggle }),
    [theme, resolved, setTheme, toggle],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}
