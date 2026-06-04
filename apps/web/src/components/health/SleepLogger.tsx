"use client";

import { useState } from "react";
import { Moon, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateHealthLogMutation } from "@/redux/api/healthLogApi";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { getTemplate } from "./templates";

const qualityOptions = [
  { value: 1, label: "Poor", emoji: "😴" },
  { value: 2, label: "Fair", emoji: "😪" },
  { value: 3, label: "Good", emoji: "🛌" },
  { value: 4, label: "Great", emoji: "✨" },
  { value: 5, label: "Excellent", emoji: "💤" },
];

export default function SleepLogger() {
  const tpl = getTemplate("ROUTINE");
  const [hours, setHours] = useState("");
  const [quality, setQuality] = useState(3);
  const [createLog, { isLoading }] = useCreateHealthLogMutation();
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    if (!hours) return;
    try {
      await createLog({
        type: "QUICK",
        data: { type: "sleep", sleepHours: parseFloat(hours), sleepQuality: quality },
      }).unwrap();
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setHours("");
      }, 2500);
    } catch {
      /* handled */
    }
  };

  return (
    <GlassCard variant="subtle" className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex size-8 items-center justify-center rounded-xl"
          style={{
            background: `color-mix(in oklch, ${tpl.accent} 18%, transparent)`,
            color: tpl.text,
          }}
        >
          <Moon className="size-4" />
        </div>
        <h3 className="font-display text-sm font-semibold">Sleep Logger</h3>
      </div>
      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel className="text-xs">Hours slept</FieldLabel>
          <Input
            type="number"
            min="0"
            max="24"
            step="0.5"
            placeholder="8"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel className="text-xs">Quality</FieldLabel>
          <div className="flex gap-1">
            {qualityOptions.map((q) => (
              <button
                key={q.value}
                type="button"
                onClick={() => setQuality(q.value)}
                className="flex flex-1 flex-col items-center gap-0.5 rounded-lg border py-1.5 text-[10px] font-medium transition-all"
                style={
                  quality === q.value
                    ? {
                        borderColor: tpl.accent,
                        background: `color-mix(in oklch, ${tpl.accent} 12%, transparent)`,
                        color: tpl.text,
                      }
                    : {
                        borderColor: "var(--border-default)",
                        color: "var(--muted-foreground)",
                      }
                }
              >
                <span className="text-base">{q.emoji}</span>
                {q.label}
              </button>
            ))}
          </div>
        </Field>
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex h-9 items-center justify-center gap-2 rounded-xl bg-brand-green/15 text-sm font-medium text-brand-green"
            >
              <Check className="size-4" /> Logged!
            </motion.div>
          ) : (
            <motion.div
              key="btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                onClick={handleSave}
                disabled={!hours || isLoading}
                className="w-full"
                size="sm"
              >
                {isLoading ? "Saving..." : "Log Sleep"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </FieldGroup>
    </GlassCard>
  );
}
