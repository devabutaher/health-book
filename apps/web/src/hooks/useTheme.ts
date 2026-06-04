"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { applyTheme, getStoredTheme, setStoredTheme, type Theme } from "@/lib/theme";
import { setThemePreference, type ThemePreference } from "@/redux/slices/settingsSlice";

function resolveTheme(theme: ThemePreference): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return theme;
}

function subscribeToResolved(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getResolvedSnapshot(theme: ThemePreference): "light" | "dark" {
  return resolveTheme(theme);
}

function getServerResolvedSnapshot(): "light" | "dark" {
  return "dark";
}

const initialStored = (() => {
  if (typeof window === "undefined") return "dark" as ThemePreference;
  return getStoredTheme();
})();

export function useTheme() {
  const dispatch = useAppDispatch();
  const themePreference = useAppSelector((s) => s.settings.themePreference) ?? initialStored;
  const resolved = useSyncExternalStore(
    subscribeToResolved,
    () => getResolvedSnapshot(themePreference),
    getServerResolvedSnapshot,
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    applyTheme(themePreference);
  }, [themePreference]);

  const setTheme = useCallback(
    (next: Theme) => {
      setStoredTheme(next);
      dispatch(setThemePreference(next));
    },
    [dispatch],
  );

  const toggle = useCallback(() => {
    const next: Theme = resolved === "dark" ? "light" : "dark";
    setTheme(next);
  }, [resolved, setTheme]);

  return { theme: themePreference as Theme, resolved, setTheme, toggle };
}
