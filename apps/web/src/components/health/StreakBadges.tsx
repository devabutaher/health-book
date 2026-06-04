"use client";

import { Award } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

const milestones = [
  {
    days: 7,
    label: "7-Day Streak",
    emoji: "🔥",
    color: "oklch(0.78 0.18 60)",
    glow: "oklch(0.78 0.18 60 / 0.4)",
  },
  {
    days: 30,
    label: "30-Day Streak",
    emoji: "⚡",
    color: "oklch(0.78 0.18 80)",
    glow: "oklch(0.78 0.18 80 / 0.4)",
  },
  {
    days: 100,
    label: "100-Day Streak",
    emoji: "🏆",
    color: "oklch(0.696 0.17 290)",
    glow: "oklch(0.696 0.17 290 / 0.4)",
  },
  {
    days: 365,
    label: "365-Day Streak",
    emoji: "👑",
    color: "oklch(0.696 0.17 162.48)",
    glow: "oklch(0.696 0.17 162.48 / 0.4)",
  },
];

export default function StreakBadges({ streak }: { streak: number }) {
  const earned = milestones.filter((m) => streak >= m.days);
  const nextMilestone = milestones.find((m) => streak < m.days);
  const progress = nextMilestone ? (streak / nextMilestone.days) * 100 : 100;

  return (
    <GlassCard variant="subtle" className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-xl bg-brand-amber/15 text-brand-amber">
          <Award className="size-4" />
        </div>
        <h3 className="font-display text-sm font-semibold">Streak Badges</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {earned.length > 0 ? (
          earned.map((m) => (
            <div
              key={m.days}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{
                background: `color-mix(in oklch, ${m.color} 15%, transparent)`,
                borderColor: `color-mix(in oklch, ${m.color} 40%, transparent)`,
                color: m.color,
              }}
            >
              <span className="text-base">{m.emoji}</span>
              {m.label}
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">No badges yet. Log daily to earn!</p>
        )}
      </div>
      {nextMilestone && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {nextMilestone.emoji} {nextMilestone.days - streak} day
              {nextMilestone.days - streak !== 1 ? "s" : ""} until {nextMilestone.label}
            </span>
            <span className="font-mono font-semibold" style={{ color: nextMilestone.color }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-overlay)]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: nextMilestone.color }}
            />
          </div>
        </div>
      )}
    </GlassCard>
  );
}
