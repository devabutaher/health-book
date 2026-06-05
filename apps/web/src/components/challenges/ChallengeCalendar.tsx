"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getChallengeDayElapsed } from "@/lib/getChallengeDay";

export function ChallengeCalendar({
  days,
  dayCount,
  startDate,
  onDayClick,
}: {
  days: {
    dayNumber: number;
    completed: boolean;
    mediaUrls: string[];
    notes: string | null;
    completedAt: string | null;
    value?: number | null;
  }[];
  dayCount: number;
  startDate: string;
  onDayClick?: (dayNumber: number) => void;
}) {
  const today = Math.min(getChallengeDayElapsed(startDate), dayCount);

  const dayMap = new Map(days.map((d) => [d.dayNumber, d]));

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Calendar</h3>
        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <div className="size-2.5 rounded bg-brand-teal" /> Done
          </span>
          <span className="flex items-center gap-1">
            <div className="size-2.5 rounded bg-[var(--bg-subtle)]" /> Missed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: dayCount }, (_, i) => {
          const day = i + 1;
          const entry = dayMap.get(day);
          const isCompleted = entry?.completed ?? false;
          const isToday = day === today;
          const isFuture = day > today;
          const hasPhoto = (entry?.mediaUrls?.length ?? 0) > 0;
          const dayValue = entry?.value;

          const tooltip = `Day ${day}${isCompleted ? " ✓" : ""}${dayValue != null ? ` — ${dayValue}` : ""}${hasPhoto ? " 📷" : ""}`;

          return (
            <button
              key={day}
              disabled={isFuture && !isToday}
              onClick={() => {
                if (!isFuture || isToday) onDayClick?.(day);
              }}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-lg text-[10px] font-semibold transition-all",
                isCompleted && "bg-brand-teal text-white",
                !isCompleted && !isFuture && "bg-[var(--bg-subtle)] text-[var(--text-muted)]",
                isFuture &&
                  !isToday &&
                  "bg-[var(--bg-overlay)] text-[var(--text-muted)] opacity-40 cursor-not-allowed",
                isToday &&
                  !isCompleted &&
                  "border-2 border-brand-blue bg-[var(--bg-subtle)] text-[var(--text-primary)]",
                !isFuture && !isCompleted && "hover:bg-[var(--bg-overlay)] cursor-pointer",
              )}
              title={tooltip}
            >
              {isCompleted ? (
                <Check className="size-3.5" />
              ) : isToday && !isCompleted ? (
                <Circle className="size-2 fill-brand-blue" />
              ) : (
                <span>{day}</span>
              )}
              {hasPhoto && isCompleted && (
                <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-brand-amber border border-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
