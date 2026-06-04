"use client";

import { useState, useMemo } from "react";
import { Dumbbell, ArrowUp, ArrowDown } from "lucide-react";
import { useGetHealthLogsQuery, type HealthLog } from "@/redux/api/healthLogApi";
import { GlassCard } from "@/components/ui/glass-card";

type SortKey = "date" | "duration" | "calories" | "intensity";

export default function WorkoutHistoryTable() {
  const { data, isLoading } = useGetHealthLogsQuery({ type: "WORKOUT", limit: 100 });
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const workouts = useMemo(() => {
    const logs = ((data?.logs || []) as HealthLog[]).map((l) => {
      const d = l.data as Record<string, unknown>;
      return {
        id: l.id,
        date: l.date,
        activityType: (d.activityType as string) || "—",
        duration: (d.duration as number) || 0,
        calories: (d.calories as number) || 0,
        intensity: (d.intensity as number) || 0,
      };
    });

    return logs.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "desc" ? bVal - aVal : aVal - bVal;
      }
      return sortDir === "desc"
        ? String(bVal).localeCompare(String(aVal))
        : String(aVal).localeCompare(String(bVal));
    });
  }, [data, sortKey, sortDir]);

  const toggle = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <GlassCard variant="subtle" className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-xl bg-brand-green/15 text-brand-green">
          <Dumbbell className="size-4" />
        </div>
        <h3 className="font-display text-sm font-semibold">Workout History</h3>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No workouts logged yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-muted-foreground">
                {[
                  { k: "date" as const, label: "Date", align: "left" },
                  { k: null, label: "Activity", align: "left" },
                  { k: "duration" as const, label: "Min", align: "right" },
                  { k: "calories" as const, label: "Cal", align: "right" },
                  { k: "intensity" as const, label: "Intensity", align: "right" },
                ].map((c) => (
                  <th
                    key={c.label}
                    onClick={() => c.k && toggle(c.k)}
                    className={`px-3 py-2.5 text-${c.align} text-[10px] font-semibold uppercase tracking-wide ${c.k ? "cursor-pointer transition-colors hover:text-foreground" : ""}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.label}
                      {c.k === sortKey &&
                        (sortDir === "desc" ? (
                          <ArrowDown className="size-3" />
                        ) : (
                          <ArrowUp className="size-3" />
                        ))}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workouts.map((w) => (
                <tr
                  key={w.id}
                  className="border-b border-[var(--border-subtle)] transition-colors last:border-0 hover:bg-[var(--bg-overlay)]"
                >
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(w.date).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 font-medium">{w.activityType}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{w.duration}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{w.calories}</td>
                  <td className="px-3 py-2 text-right">
                    <span className="inline-flex items-center gap-1">
                      <span className="font-mono">{w.intensity}</span>
                      <span className="text-xs text-muted-foreground">/10</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}
