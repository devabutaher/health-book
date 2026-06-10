"use client";

import { Brain } from "lucide-react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useGetTrendsQuery } from "@/redux/api/healthLogApi";
import { GlassCard } from "@/components/ui/glass-card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const config = {
  avgMood: { label: "Mood", color: "var(--brand-purple)" },
} as const;

export default function MoodChart() {
  const { data } = useGetTrendsQuery({ days: 90 });
  const mood = (data?.data?.mood || []).filter((m: { entries: number }) => m.entries > 0);
  const chartData = mood.length > 0 ? mood : [{ week: "No data", avgMood: 3 }];

  return (
    <GlassCard variant="subtle" className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-xl bg-brand-purple/15 text-brand-purple">
          <Brain className="size-4" />
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold">Mood Trend</h3>
          <p className="text-[10px] text-muted-foreground">90 day journey</p>
        </div>
      </div>
      <ChartContainer config={config} className="aspect-auto h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.696 0.17 290)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="oklch(0.696 0.17 290)" stopOpacity={0} />
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
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={24}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="avgMood"
              stroke="oklch(0.696 0.17 290)"
              strokeWidth={2.5}
              fill="url(#moodGrad)"
              dot={{ r: 3, fill: "oklch(0.696 0.17 290)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </GlassCard>
  );
}
