import * as React from "react";
import { cn } from "@/lib/utils";

export type GlassVariant = "default" | "elevated" | "subtle" | "noise";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  glow?: "none" | "teal" | "green" | "blue" | "coral" | "purple" | "amber";
}

const variantClasses: Record<GlassVariant, string> = {
  default: "bg-[var(--glass-bg)]",
  elevated: "bg-[var(--bg-elevated)]",
  subtle: "bg-[var(--bg-overlay)]",
  noise: "bg-[var(--glass-bg)] glass-noise",
};

const glowClasses: Record<NonNullable<GlassCardProps["glow"]>, string> = {
  none: "",
  teal: "shadow-[var(--shadow-glow-teal)]",
  green: "shadow-[var(--shadow-glow-green)]",
  blue: "shadow-[var(--shadow-glow-blue)]",
  coral: "shadow-[var(--shadow-glow-coral)]",
  purple: "shadow-[var(--shadow-glow-purple)]",
  amber: "shadow-[var(--shadow-glow-amber)]",
};

function GlassCard({ className, variant = "default", glow = "none", ...props }: GlassCardProps) {
  return (
    <div
      data-slot="glass-card"
      data-variant={variant}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[var(--glass-border)] backdrop-blur-md md:backdrop-blur-xl",
        variantClasses[variant],
        "shadow-[var(--shadow-card)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lg)]",
        glowClasses[glow],
        className,
      )}
      {...props}
    />
  );
}

export { GlassCard };
