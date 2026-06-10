"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface DayData {
  dayNumber: number;
  completed: boolean;
  value?: number | null;
}

function CustomTooltip({
  active,
  payload,
  label,
  view,
  goalUnit,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  view: "daily" | "cumulative";
  goalUnit?: string | null;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-xs shadow-[var(--shadow-lg)]">
      <p className="font-bold text-[var(--text-primary)]">{label}</p>
      <p className="text-[var(--text-secondary)]">
        {view === "daily" ? "Completed: " : "Total: "}
        <span className="font-semibold text-brand-teal">{payload[0]?.value}</span>
        {view === "daily" && goalUnit && payload[0]?.value > 1 && ` ${goalUnit}`}
      </p>
    </div>
  );
}

export function ChallengeProgressChart({
  days,
  goalUnit,
}: {
  days: DayData[];
  goalUnit?: string | null;
}) {
  const [view, setView] = useState<"daily" | "cumulative">("daily");

  const chartData = days.map((d) => ({
    day: `D${d.dayNumber}`,
    completed: d.completed ? 1 : 0,
    value: d.value ?? 0,
    cumulative: 0,
  }));

  let runningTotal = 0;
  for (const d of chartData) {
    runningTotal += d.completed;
    d.cumulative = runningTotal;
  }

  const completedDays = days.filter((d) => d.completed).length;
  const hasValueData = days.some((d) => d.value != null && d.value > 0);

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">
          Progress {view === "daily" ? "per Day" : "Cumulative"}
        </h3>
        <div className="flex gap-1">
          {(["daily", "cumulative"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors",
                view === v
                  ? "bg-brand-teal text-white"
                  : "bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]",
              )}
            >
              {v === "daily" ? "Daily" : "Total"}
            </button>
          ))}
        </div>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height={160}>
          {view === "daily" ? (
            <BarChart data={chartData} barCategoryGap={2}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-default)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval={Math.max(0, Math.floor(chartData.length / 15))}
              />
              <YAxis
                domain={[0, "auto"]}
                tick={{ fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={20}
              />
              <Tooltip
                content={<CustomTooltip view={view} goalUnit={goalUnit} />}
                cursor={{ fill: "var(--bg-overlay)" }}
              />
              <Bar dataKey="completed" radius={[2, 2, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={"cell-" + entry.day}
                    fill={entry.completed ? "var(--color-brand-teal, #14b8a6)" : "var(--bg-subtle)"}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <AreaChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-default)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval={Math.max(0, Math.floor(chartData.length / 15))}
              />
              <YAxis
                domain={[0, "auto"]}
                tick={{ fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={20}
              />
              <Tooltip content={<CustomTooltip view={view} goalUnit={goalUnit} />} />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#14b8a6"
                fill="url(#cumulativeGrad)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="cumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
        <span className="flex items-center gap-1">
          <div className="size-2 rounded bg-brand-teal" /> {completedDays}/{days.length} days
        </span>
        {hasValueData && (
          <span>
            Total: {days.reduce((s, d) => s + (d.value ?? 0), 0).toFixed(1)} {goalUnit || "units"}
          </span>
        )}
      </div>
    </div>
  );
}
