"use client";

import { useState } from "react";
import { Droplet, RotateCcw, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useCreateHealthLogMutation } from "@/redux/api/healthLogApi";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { getTemplate } from "./templates";
import { playSipSound } from "@/lib/sounds";
import { soundManager } from "@/lib/soundManager";

const GOAL = 8;

function loadInitialGlasses() {
  if (typeof window === "undefined") return 0;
  const saved = localStorage.getItem("water_today");
  if (!saved) return 0;
  try {
    const { date, count } = JSON.parse(saved);
    if (date === new Date().toDateString()) return typeof count === "number" ? count : 0;
  } catch {
    /* ignore */
  }
  return 0;
}

export default function WaterWidget() {
  const tpl = getTemplate("ROUTINE");
  const [glasses, setGlasses] = useState(loadInitialGlasses);
  const [createLog] = useCreateHealthLogMutation();

  const add = async () => {
    const next = glasses + 1;
    setGlasses(next);
    playSipSound();
    localStorage.setItem(
      "water_today",
      JSON.stringify({ date: new Date().toDateString(), count: next }),
    );
    if (next === 1 || next % 2 === 0) {
      createLog({ type: "QUICK", data: { type: "water", glasses: next } }).catch((err) => {
        soundManager.playError();
        toast.error(getErrorMessage(err, "Failed to log"));
      });
    }
  };

  const reset = () => {
    setGlasses(0);
    localStorage.removeItem("water_today");
  };

  const pct = Math.min((glasses / GOAL) * 100, 100);

  return (
    <GlassCard variant="subtle" className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex size-8 items-center justify-center rounded-xl"
            style={{
              background: `color-mix(in oklch, ${tpl.accent} 18%, transparent)`,
              color: tpl.text,
            }}
          >
            <Droplet className="size-4" />
          </div>
          <h3 className="font-display text-sm font-semibold">Water Intake</h3>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {glasses}/{GOAL}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[var(--bg-overlay)]">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${tpl.accent}, color-mix(in oklch, ${tpl.accent} 70%, white))`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {Array.from({ length: GOAL }).map((_, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{ scale: i < glasses ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.3 }}
            className="flex size-7 items-center justify-center rounded-full border-2 text-xs transition-colors"
            style={
              i < glasses
                ? {
                    background: tpl.accent,
                    borderColor: tpl.accent,
                    color: "white",
                  }
                : {
                    background: "transparent",
                    borderColor: "var(--border-default)",
                  }
            }
          >
            {i < glasses ? "💧" : ""}
          </motion.div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={add} className="flex-1" size="sm">
          <Plus className="size-4" />
          Glass
        </Button>
        {glasses > 0 && (
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="size-4" />
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
