"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DayPlan {
  dayNumber: number;
  title: string;
  description: string;
  tips: string;
  mediaUrls: string[];
  duration: number;
}

export function DayPlanEditor({
  dayCount,
  initialPlans,
  onSave,
  saving,
}: {
  dayCount: number;
  initialPlans?: DayPlan[];
  onSave: (plans: DayPlan[]) => Promise<void>;
  saving?: boolean;
}) {
  const [plans, setPlans] = useState<DayPlan[]>(
    initialPlans?.length
      ? initialPlans
      : Array.from({ length: dayCount }, (_, i) => ({
          dayNumber: i + 1,
          title: "",
          description: "",
          tips: "",
          mediaUrls: [],
          duration: 0,
        })),
  );
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkTemplate, setBulkTemplate] = useState("");

  const toggleDay = (day: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const updatePlan = (
    dayNumber: number,
    field: keyof DayPlan,
    value: string | number | string[],
  ) => {
    setPlans((prev) => prev.map((p) => (p.dayNumber === dayNumber ? { ...p, [field]: value } : p)));
  };

  const applyBulkTemplate = () => {
    const lines = bulkTemplate.trim().split("\n");
    const updated = [...plans];
    lines.forEach((line, i) => {
      const day = i + 1;
      if (day > dayCount) return;
      const [title, ...descParts] = line.split("|");
      if (updated[day - 1]) {
        updated[day - 1] = {
          ...updated[day - 1],
          title: title?.trim() || "",
          description: descParts.join("|").trim() || "",
        };
      }
    });
    setPlans(updated);
    toast.success(`Applied template to ${Math.min(lines.length, dayCount)} days`);
    setBulkMode(false);
    setBulkTemplate("");
  };

  const fillFromTemplate = () => {
    const templates = [
      "Rest Day|Focus on recovery and stretching",
      "Light Cardio|15min light jog or brisk walk",
      "Core Workout|Planks, crunches, and leg raises",
      "Upper Body|Push-ups, pull-ups, and dips",
      "Lower Body|Squats, lunges, and calf raises",
      "Full Body|Combine upper and lower body exercises",
      "Active Recovery|Yoga or light stretching session",
      "HIIT|High intensity interval training",
      "Endurance|Long duration steady state cardio",
      "Strength Training|Progressive overload workout",
    ];
    const updated = plans.map((p, i) => ({
      ...p,
      title: templates[i % templates.length]?.split("|")[0] || "",
      description: templates[i % templates.length]?.split("|")[1] || "",
    }));
    setPlans(updated);
    toast.success("Filled with template suggestions");
  };

  const handleSave = async () => {
    const filled = plans.filter((p) => p.title.trim());
    if (filled.length === 0) {
      toast.error("Add at least one day plan");
      return;
    }
    await onSave(filled);
  };

  const filledCount = plans.filter((p) => p.title.trim()).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Day Plans</h3>
          <p className="text-[10px] text-[var(--text-muted)]">
            {filledCount}/{dayCount} days planned
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setBulkMode(!bulkMode)}
          >
            {bulkMode ? "Single" : "Bulk"}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={fillFromTemplate}>
            Templates
          </Button>
        </div>
      </div>

      {bulkMode && (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-3 space-y-2">
          <p className="text-[10px] text-[var(--text-muted)]">
            One line per day. Format: <strong>Title | Description</strong>
          </p>
          <textarea
            value={bulkTemplate}
            onChange={(e) => setBulkTemplate(e.target.value)}
            placeholder={
              "Day 1: Warm Up|Light cardio and stretching\nDay 2: Core|Planks and crunches"
            }
            rows={5}
            className="w-full resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none"
          />
          <div className="flex gap-2">
            <Button type="button" variant="gradient" size="sm" onClick={applyBulkTemplate}>
              Apply
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setBulkMode(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
        {plans.map((plan) => (
          <div
            key={plan.dayNumber}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleDay(plan.dayNumber)}
              className="flex w-full items-center justify-between px-3 py-2 text-left"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-brand-teal/10 text-[10px] font-bold text-brand-teal">
                  {plan.dayNumber}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    plan.title ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]",
                  )}
                >
                  {plan.title || `Day ${plan.dayNumber}`}
                </span>
              </div>
              {expandedDays.has(plan.dayNumber) ? (
                <ChevronUp className="size-3.5 text-[var(--text-muted)]" />
              ) : (
                <ChevronDown className="size-3.5 text-[var(--text-muted)]" />
              )}
            </button>

            {expandedDays.has(plan.dayNumber) && (
              <div className="space-y-2 border-t border-[var(--border-default)] p-3">
                <input
                  value={plan.title}
                  onChange={(e) => updatePlan(plan.dayNumber, "title", e.target.value)}
                  placeholder="Day title (e.g. Upper Body Workout)"
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none"
                />
                <textarea
                  value={plan.description}
                  onChange={(e) => updatePlan(plan.dayNumber, "description", e.target.value)}
                  placeholder="What to do on this day..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                    <Clock className="size-3" />
                    <input
                      type="number"
                      min="0"
                      value={plan.duration || ""}
                      onChange={(e) =>
                        updatePlan(plan.dayNumber, "duration", Number(e.target.value) || 0)
                      }
                      placeholder="min"
                      className="w-16 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none"
                    />
                    min
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                    <ImageIcon className="size-3" />
                    <span>{plan.mediaUrls.length} media</span>
                  </div>
                </div>
                <textarea
                  value={plan.tips}
                  onChange={(e) => updatePlan(plan.dayNumber, "tips", e.target.value)}
                  placeholder="Tips for this day..."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {filledCount > 0 && (
        <Button
          type="button"
          variant="gradient"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? "Saving..." : `Save ${filledCount} Day Plan${filledCount !== 1 ? "s" : ""}`}
        </Button>
      )}
    </div>
  );
}
