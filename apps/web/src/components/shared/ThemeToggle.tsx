"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeContext } from "./ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolved, toggle } = useThemeContext();
  const isDark = resolved === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200",
        "hover:bg-[var(--bg-overlay)] hover:text-foreground",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40",
        className,
      )}
    >
      <Sun
        className={cn(
          "size-5 transition-all duration-300",
          isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
        )}
      />
      <Moon
        className={cn(
          "absolute size-5 transition-all duration-300",
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
        )}
      />
    </button>
  );
}
