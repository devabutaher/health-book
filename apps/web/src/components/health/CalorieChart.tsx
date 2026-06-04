"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { useGetTrendsQuery } from "@/redux/api/healthLogApi";
import { GlassCard } from "@/components/ui/glass-card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const config = {
  calories: { label: "Calories", color: "var(--brand-coral)" },
} as const;

export default function CalorieChart() {
  const [days, setDays] = useState(30);
  const { data } = useGetTrendsQuery({ days });
  const calories = (data?.data?.calories || []).filter((c: { calories: number }) => c.calories > 0);
  const chartData = calories.length > 0 ? calories : [{ week: "No data", calories: 0 }];

  return (
    <GlassCard variant="subtle" className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-brand-coral/15 text-brand-coral">
            <Flame className="size-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold">Calories Burned</h3>
            <p className="text-[10px] text-muted-foreground">Energy you crushed</p>
          </div>
        </div>
        <ToggleGroup
          type="single"
          value={String(days)}
          onValueChange={(v) => v && setDays(parseInt(v))}
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-0.5"
        >
          {["7", "30", "90"].map((d) => (
            <ToggleGroupItem key={d} value={d} className="h-9 px-3 text-[10px] font-mono">
              {d}d
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <ChartContainer config={config} className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.75 0.18 25)" stopOpacity={1} />
                <stop offset="100%" stopColor="oklch(0.65 0.22 25)" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickFormatter={(v: string) => v.slice(5)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
              {chartData.map((_: unknown, i: number) => (
                <Cell key={i} fill="url(#calGrad)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </GlassCard>
  );
}
