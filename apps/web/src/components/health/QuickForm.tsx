"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { getTemplate } from "./templates";

export interface QuickData {
  note: string;
  mood: number;
  energy: number;
}

const moods = [
  { value: 1, emoji: "😞", label: "Bad" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

export default function QuickForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: QuickData) => void;
  onCancel: () => void;
}) {
  const tpl = getTemplate("QUICK");
  const [note, setNote] = useState("");
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(5);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 pl-5"
      style={{
        boxShadow: `0 4px 24px -8px ${tpl.glow}`,
        borderColor: `color-mix(in oklch, ${tpl.accent} 20%, transparent)`,
      }}
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
          <p className="text-xs text-muted-foreground">Fast check-in</p>
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
                onClick={() => setMood(m.value)}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all"
                style={
                  mood === m.value
                    ? {
                        borderColor: tpl.accent,
                        background: `color-mix(in oklch, ${tpl.accent} 10%, transparent)`,
                      }
                    : { borderColor: "transparent" }
                }
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-[10px] font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        </Field>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel className="text-sm">Energy Level</FieldLabel>
            <span className="font-mono text-sm font-semibold" style={{ color: tpl.text }}>
              {energy}/10
            </span>
          </div>
          <Slider
            min={1}
            max={10}
            step={1}
            value={[energy]}
            onValueChange={([v]) => setEnergy(v)}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Drained</span>
            <span>Energized</span>
          </div>
        </Field>
        <Field>
          <FieldLabel className="text-sm">Quick Note</FieldLabel>
          <Textarea
            placeholder="How are you feeling? Any quick thoughts?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[80px]"
          />
        </Field>
      </FieldGroup>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit({ note, mood, energy })}>
          <Zap /> Save
        </Button>
      </div>
    </div>
  );
}
