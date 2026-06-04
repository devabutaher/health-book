"use client";

import { useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { resetApiCache } from "@/redux/store";

export default function RefreshFAB() {
  const [spinning, setSpinning] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleRefresh = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    resetApiCache();
    setLastUpdated(new Date());
    setTimeout(() => setSpinning(false), 1200);
  }, [spinning]);

  return (
    <div className="fixed z-50 bottom-20 lg:bottom-6 right-4">
      <div className="group relative">
        <button
          onClick={handleRefresh}
          disabled={spinning}
          aria-label="Refresh all data"
          className={cn(
            "relative flex size-12 items-center justify-center rounded-full",
            "bg-gradient-to-br from-brand-teal to-brand-green",
            "shadow-lg shadow-brand-teal/25",
            "border border-white/20 dark:border-white/10",
            "text-white backdrop-blur-xl",
            "transition-all duration-200",
            "hover:scale-105 hover:shadow-xl hover:shadow-brand-teal/30",
            "active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40",
            "before:absolute before:inset-0 before:rounded-full",
            "before:bg-gradient-to-br before:from-white/10 before:to-transparent",
            spinning && "pointer-events-none",
            !spinning &&
              "before:animate-pulse before:opacity-0 before:transition-opacity hover:before:opacity-100",
          )}
        >
          <RefreshCw className={cn("relative size-5", spinning && "animate-spin")} />
        </button>

        {/* Tooltip */}
        <div
          className={cn(
            "absolute bottom-full right-0 mb-2",
            "whitespace-nowrap rounded-lg",
            "bg-[var(--glass-bg)] backdrop-blur-2xl",
            "border border-[var(--glass-border)]",
            "px-3 py-1.5 text-xs",
            "shadow-lg",
            "opacity-0 -translate-y-1",
            "transition-all duration-200",
            "group-hover:opacity-100 group-hover:translate-y-0",
            "pointer-events-none group-hover:pointer-events-auto",
          )}
        >
          <p className="text-muted-foreground font-medium">Refresh all data</p>
          {lastUpdated && (
            <p className="text-muted-foreground/60 mt-0.5">
              Updated {formatRelativeTime(lastUpdated)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins === 1) return "1m ago";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1h ago";
  return `${hours}h ago`;
}
