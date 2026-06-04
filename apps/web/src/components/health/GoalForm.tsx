"use client";

import { useState } from "react";
import { Plus, X, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { getTemplate } from "./templates";

interface GoalItem {
  text: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
}
export interface GoalData {
  items: GoalItem[];
  completionRate: number;
}

const priorityEmoji: Record<string, string> = { high: "🔴", medium: "🟡", low: "🟢" };
const priorityStyle: Record<string, { bg: string; text: string }> = {
  high: { bg: "oklch(0.7 0.2 25 / 0.15)", text: "oklch(0.7 0.2 25)" },
  medium: { bg: "oklch(0.78 0.18 80 / 0.15)", text: "oklch(0.78 0.18 80)" },
  low: { bg: "oklch(0.696 0.17 162.48 / 0.15)", text: "oklch(0.696 0.17 162.48)" },
};

export default function GoalForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: GoalData) => void;
  onCancel: () => void;
}) {
  const tpl = getTemplate("GOAL");
  const [items, setItems] = useState<GoalItem[]>([]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  const addItem = () => {
    if (!text.trim()) return;
    setItems((prev) => [...prev, { text: text.trim(), priority, completed: false }]);
    setText("");
  };
  const toggleItem = (i: number) =>
    setItems((prev) =>
      prev.map((item, idx) => (idx === i ? { ...item, completed: !item.completed } : item)),
    );
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const completed = items.filter((i) => i.completed).length;
  const rate = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 pl-5"
      style={{ boxShadow: `0 4px 24px -8px ${tpl.glow}` }}
    >
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5 rounded-l-2xl"
        style={{ background: tpl.accent }}
      />
      <div className="mb-3 flex items-center gap-2">
        <span className="text-2xl">{tpl.emoji}</span>
        <div>
          <h3 className="font-display text-sm font-semibold" style={{ color: tpl.text }}>
            {tpl.label}
          </h3>
          <p className="text-xs text-muted-foreground">Set priorities, track completion</p>
        </div>
      </div>
      <FieldGroup className="gap-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Add a goal..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
            className="flex-1"
          />
          <ToggleGroup
            type="single"
            value={priority}
            onValueChange={(v) => v && setPriority(v as "high" | "medium" | "low")}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-0.5"
          >
            <ToggleGroupItem value="high" className="px-2.5 text-xs">
              🔴
            </ToggleGroupItem>
            <ToggleGroupItem value="medium" className="px-2.5 text-xs">
              🟡
            </ToggleGroupItem>
            <ToggleGroupItem value="low" className="px-2.5 text-xs">
              🟢
            </ToggleGroupItem>
          </ToggleGroup>
          <Button type="button" onClick={addItem} disabled={!text.trim()}>
            <Plus /> Add
          </Button>
        </div>

        <Field>
          <div className="mb-2 flex items-center justify-between">
            <FieldLabel className="text-sm">
              Goals ({completed}/{items.length})
            </FieldLabel>
            <span className="font-mono text-xs text-muted-foreground">{rate}%</span>
          </div>
          <Progress value={rate} className="h-1.5" />
          <AnimatePresence>
            <div className="mt-2 space-y-1.5">
              {items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(i)}
                    className="flex size-5 shrink-0 items-center justify-center rounded-md border-2 border-[var(--border-strong)] transition-colors hover:border-brand-teal data-[checked=true]:border-brand-teal data-[checked=true]:bg-brand-teal"
                    data-checked={item.completed}
                  >
                    {item.completed && <span className="text-[10px] font-bold text-white">✓</span>}
                  </button>
                  <span
                    className={`flex-1 text-sm ${item.completed ? "text-muted-foreground line-through" : ""}`}
                  >
                    {item.text}
                  </span>
                  <span
                    className="rounded-md px-1.5 py-0.5 text-xs font-medium"
                    style={{
                      background: priorityStyle[item.priority].bg,
                      color: priorityStyle[item.priority].text,
                    }}
                  >
                    {priorityEmoji[item.priority]} {item.priority}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeItem(i)}
                  >
                    <X />
                  </Button>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
          {items.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No goals yet. Add one above.
            </p>
          )}
        </Field>
      </FieldGroup>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => onSubmit({ items, completionRate: rate })}
          disabled={items.length === 0}
        >
          <Target /> Save Goals
        </Button>
      </div>
    </div>
  );
}
