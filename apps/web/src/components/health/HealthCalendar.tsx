"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useGetCalendarQuery } from "@/redux/api/healthLogApi";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getColor(score: number | undefined): { bg: string; text: string } {
  if (!score && score !== 0) return { bg: "var(--bg-subtle)", text: "var(--muted-foreground)" };
  if (score >= 80) return { bg: "oklch(0.696 0.17 162.48)", text: "white" };
  if (score >= 60) return { bg: "oklch(0.75 0.15 162.48)", text: "white" };
  if (score >= 40) return { bg: "oklch(0.78 0.18 80)", text: "oklch(0.3 0 0)" };
  if (score >= 20) return { bg: "oklch(0.7 0.18 50)", text: "white" };
  return { bg: "oklch(0.65 0.22 25)", text: "white" };
}

export default function HealthCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { data } = useGetCalendarQuery({ year, month });
  const days = data?.data?.days || {};

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const prev = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  };
  const next = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  };

  const monthName = new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <GlassCard variant="subtle" className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-brand-teal/15 text-brand-teal">
            <Calendar className="size-4" />
          </div>
          <h3 className="font-display text-sm font-semibold">Health Calendar</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={prev} aria-label="Previous month">
            <ChevronLeft />
          </Button>
          <span className="min-w-[120px] text-center text-sm font-medium">{monthName}</span>
          <Button variant="outline" size="icon-sm" onClick={next} aria-label="Next month">
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayData = days[key];
          const c = getColor(dayData?.score);
          return (
            <div
              key={day}
              className="flex aspect-square items-center justify-center rounded-md text-xs font-medium transition-transform hover:scale-110"
              style={{ background: c.bg, color: c.text }}
              title={dayData ? `Score: ${dayData.score} · ${dayData.count} logs` : "No log"}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ background: "oklch(0.696 0.17 162.48)" }}
          />
          Great
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ background: "oklch(0.78 0.18 80)" }}
          />
          OK
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ background: "oklch(0.65 0.22 25)" }}
          />
          Low
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ background: "var(--bg-subtle)" }}
          />
          None
        </span>
      </div>
    </GlassCard>
  );
}
