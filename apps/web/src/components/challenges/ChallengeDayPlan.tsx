"use client";

import { Clock, Lightbulb, FileText } from "lucide-react";

interface DayPlan {
  id: string;
  challengeId: string;
  dayNumber: number;
  title: string | null;
  description: string | null;
  tips: string | null;
  mediaUrls: string[];
  duration: number | null;
}

export function ChallengeDayPlan({ plan }: { plan: DayPlan | null }) {
  if (!plan || (!plan.title && !plan.description && !plan.tips)) {
    return null;
  }

  return (
    <div className="rounded-xl border border-brand-teal/20 bg-gradient-to-br from-brand-teal/[0.05] to-brand-green/[0.03] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-brand-teal/10 text-[10px] font-bold text-brand-teal">
              {plan.dayNumber}
            </span>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">
              {plan.title || `Day ${plan.dayNumber}`}
            </h4>
          </div>

          {plan.description && (
            <div className="mt-2 flex items-start gap-1.5">
              <FileText className="mt-0.5 size-3 shrink-0 text-brand-teal" />
              <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap">
                {plan.description}
              </p>
            </div>
          )}

          {plan.tips && (
            <div className="mt-2 flex items-start gap-1.5">
              <Lightbulb className="mt-0.5 size-3 shrink-0 text-brand-amber" />
              <p className="text-xs text-brand-amber/80 whitespace-pre-wrap">{plan.tips}</p>
            </div>
          )}
        </div>

        {plan.duration != null && plan.duration > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-teal/10 px-2 py-0.5 text-[10px] font-semibold text-brand-teal">
            <Clock className="size-3" />
            {plan.duration} min
          </span>
        )}
      </div>
    </div>
  );
}
