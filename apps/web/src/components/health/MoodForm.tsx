"use client";

import { useState } from "react";
import { Plus, X, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { getTemplate } from "./templates";
import { playDropSound, playTabSound } from "@/lib/sounds";

export interface MoodData {
  mood: number;
  gratitude: string[];
  reflection: string;
  stressLevel: number;
}

const moods = [
  { value: 1, emoji: "😞", label: "Bad" },
  { value: 2, emoji: "😕", label: "Not Great" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

export default function MoodForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: MoodData) => void;
  onCancel: () => void;
}) {
  const tpl = getTemplate("MOOD");
  const [data, setData] = useState<MoodData>({
    mood: 3,
    gratitude: [],
    reflection: "",
    stressLevel: 5,
  });
  const [gratitude, setGratitude] = useState("");

  const addGratitude = () => {
    if (!gratitude.trim()) return;
    playDropSound();
    setData((d) => ({ ...d, gratitude: [...d.gratitude, gratitude.trim()] }));
    setGratitude("");
  };
  const removeGratitude = (i: number) =>
    setData((d) => ({ ...d, gratitude: d.gratitude.filter((_, idx) => idx !== i) }));

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
          <p className="text-xs text-muted-foreground">Check in with yourself</p>
        </div>
      </div>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel className="text-sm">How are you feeling?</FieldLabel>
          <div className="mt-2 flex justify-between gap-1">
            {moods.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => {
                  playTabSound();
                  setData((d) => ({ ...d, mood: m.value }));
                }}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all"
                style={
                  data.mood === m.value
                    ? {
                        borderColor: tpl.accent,
                        background: `color-mix(in oklch, ${tpl.accent} 10%, transparent)`,
                      }
                    : {
                        borderColor: "transparent",
                      }
                }
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-[10px] font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field>
          <FieldLabel className="text-sm">Gratitude Journal</FieldLabel>
          <AnimatePresence>
            <div className="mt-2 space-y-1">
              {data.gratitude.map((g, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2 text-sm"
                >
                  <span style={{ color: tpl.text }}>✦</span>
                  <span className="flex-1">{g}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeGratitude(i)}
                  >
                    <X />
                  </Button>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
          <div className="mt-2 flex gap-2">
            <Textarea
              placeholder="I'm grateful for..."
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              className="min-h-[44px] flex-1 resize-none"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addGratitude}
              disabled={!gratitude.trim()}
            >
              <Plus />
            </Button>
          </div>
        </Field>

        <Field>
          <FieldLabel className="text-sm">Reflection Notes</FieldLabel>
          <Textarea
            placeholder="How was your day? Any thoughts to note?"
            value={data.reflection}
            onChange={(e) => setData((d) => ({ ...d, reflection: e.target.value }))}
            className="min-h-[80px]"
          />
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel className="text-sm">Stress Level</FieldLabel>
            <span className="font-mono text-sm font-semibold" style={{ color: tpl.text }}>
              {data.stressLevel}/10
            </span>
          </div>
          <Slider
            min={1}
            max={10}
            step={1}
            value={[data.stressLevel]}
            onValueChange={([v]) => setData((d) => ({ ...d, stressLevel: v }))}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Calm</span>
            <span>Overwhelmed</span>
          </div>
        </Field>
      </FieldGroup>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit(data)}>
          <Brain /> Save Mood
        </Button>
      </div>
    </div>
  );
}
