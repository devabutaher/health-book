"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface DayData {
  dayNumber: number;
  completed: boolean;
  value?: number | null;
}

export function ChallengeHeatMap({ days, dayCount }: { days: DayData[]; dayCount: number }) {
  const weeks = useMemo(() => {
    const totalWeeks = Math.ceil(dayCount / 7);
    const grid: { week: number; days: (DayData | null)[] }[] = [];

    for (let w = 0; w < totalWeeks; w++) {
      const weekDays: (DayData | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const dayNum = w * 7 + d + 1;
        if (dayNum > dayCount) {
          weekDays.push(null);
        } else {
          weekDays.push(
            days.find((dd) => dd.dayNumber === dayNum) ?? { dayNumber: dayNum, completed: false },
          );
        }
      }
      grid.push({ week: w, days: weekDays });
    }
    return grid;
  }, [days, dayCount]);

  const completedCount = days.filter((d) => d.completed).length;

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Heat Map</h3>
        <span className="text-[10px] text-[var(--text-muted)]">
          {completedCount}/{dayCount} days
        </span>
      </div>

      <div className="flex gap-1">
        <div className="flex flex-col gap-1 py-0.5">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <span
              key={d}
              className="text-[8px] text-[var(--text-muted)] leading-3 h-3 flex items-center"
            >
              {d[0]}
            </span>
          ))}
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {weeks.map((week) => (
            <div key={week.week} className="flex flex-col gap-1">
              {week.days.map((day, idx) => {
                if (!day) return <div key={`n-${week.week}-${idx}`} className="size-3" />;
                return (
                  <div
                    key={`d-${week.week}-${day.dayNumber}`}
                    title={`Day ${day.dayNumber}: ${day.completed ? "Completed" : "Missed"}${day.value ? ` (${day.value})` : ""}`}
                    className={cn(
                      "size-3 rounded-sm transition-colors",
                      day.completed ? "bg-brand-teal" : "bg-[var(--bg-subtle)]",
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
        <span className="flex items-center gap-1">
          <div className="size-2.5 rounded-sm bg-[var(--bg-subtle)]" /> Missed
        </span>
        <span className="flex items-center gap-1">
          <div className="size-2.5 rounded-sm bg-brand-teal" /> Done
        </span>
      </div>
    </div>
  );
}
