"use client";

import { format } from "date-fns";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { getTemplate } from "./templates";

const moodEmojis = ["", "😞", "😕", "😐", "😊", "😄"];

export default function HealthLogEmbed({
  healthLog,
}: {
  healthLog: { type: string; score: number | null; data: Record<string, unknown>; date: string };
}) {
  const tpl = getTemplate(healthLog.type as "ROUTINE" | "GOAL" | "WORKOUT" | "MOOD" | "QUICK");
  const data = healthLog.data || {};

  return (
    <GlassCard
      variant="subtle"
      className="relative overflow-hidden p-3 pl-4"
      style={{ boxShadow: `0 4px 16px -8px ${tpl.glow}` }}
    >
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
        style={{ background: tpl.accent }}
      />
      <div className="flex items-center justify-between gap-2">
        <span
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: tpl.text }}
        >
          <span aria-hidden>{tpl.emoji}</span>
          {tpl.label}
        </span>
        {healthLog.score != null && (
          <Badge variant="default" className="font-mono text-[10px]">
            {healthLog.score}/100
          </Badge>
        )}
      </div>
      <div className="mt-1.5 text-xs text-foreground/90">
        {healthLog.type === "ROUTINE" && (
          <div className="grid grid-cols-2 gap-1">
            <span>
              🛏️ {String(data.wakeTime || "—")} → {String(data.sleepTime || "—")}
            </span>
            <span>💧 {String(data.waterIntake || 0)} glasses</span>
          </div>
        )}
        {healthLog.type === "GOAL" && (
          <div className="space-y-0.5">
            {Array.isArray(data.items) &&
              data.items
                .slice(0, 4)
                .map(
                  (
                    item: { text?: string; title?: string; name?: string; completed: boolean },
                    i: number,
                  ) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span>{item.completed ? "✅" : "⬜"}</span>
                      <span className="truncate">
                        {item.text || item.title || item.name || `Item ${i + 1}`}
                      </span>
                    </div>
                  ),
                )}
            {data.completionRate != null && (
              <span className="text-muted-foreground">
                {Math.round(data.completionRate as number)}% complete
              </span>
            )}
          </div>
        )}
        {healthLog.type === "WORKOUT" && (
          <div className="grid grid-cols-2 gap-1">
            <span>🏃 {String(data.activityType || "—")}</span>
            <span>⏱ {String(data.duration || 0)}m</span>
            <span>🔥 {String(data.calories || 0)} cal</span>
            <span>💪 {Array.isArray(data.exercises) ? data.exercises.length : 0} exercises</span>
          </div>
        )}
        {healthLog.type === "MOOD" && (
          <div className="space-y-0.5">
            <span>
              {moodEmojis[data.mood as number] || "😐"} {String(data.mood || "—")}/5
            </span>
            {Array.isArray(data.gratitude) && data.gratitude.length > 0 && (
              <span className="block truncate text-muted-foreground">
                🙏 {String(data.gratitude[0])}
              </span>
            )}
          </div>
        )}
        {healthLog.type === "QUICK" &&
          (() => {
            const kind = data.type as string;
            if (kind === "water") return <span>💧 {String(data.glasses)} glasses of water</span>;
            if (kind === "sleep")
              return (
                <span>
                  😴 {String(data.sleepHours)}h sleep (quality: {String(data.sleepQuality)}/5)
                </span>
              );
            return <span className="text-muted-foreground">Quick log</span>;
          })()}
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {format(new Date(healthLog.date), "MMM d, yyyy")}
      </p>
    </GlassCard>
  );
}
