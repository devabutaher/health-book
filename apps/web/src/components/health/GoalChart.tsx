"use client";

import { Target } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { useGetTrendsQuery } from "@/redux/api/healthLogApi";
import { GlassCard } from "@/components/ui/glass-card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const config = {
  avgCompletion: { label: "Completion", color: "var(--brand-green)" },
} as const;

export default function GoalChart() {
  const { data } = useGetTrendsQuery({ days: 90 });
  const goals = (data?.data?.goals || []).filter((g: { count: number }) => g.count > 0);
  const chartData = goals.length > 0 ? goals : [{ week: "No data", avgCompletion: 0 }];

  return (
    <GlassCard variant="subtle" className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-xl bg-brand-green/15 text-brand-green">
          <Target className="size-4" />
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold">Goal Completion</h3>
          <p className="text-[10px] text-muted-foreground">90 day progress</p>
        </div>
      </div>
      <ChartContainer config={config} className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.18 162.48)" stopOpacity={1} />
                <stop offset="100%" stopColor="oklch(0.65 0.17 162.48)" stopOpacity={0.7} />
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
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="avgCompletion" radius={[6, 6, 0, 0]}>
              {chartData.map((_: unknown, i: number) => (
                <Cell key={i} fill="url(#goalGrad)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </GlassCard>
  );
}
