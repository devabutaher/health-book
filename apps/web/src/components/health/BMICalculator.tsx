"use client";

import { useState, useMemo } from "react";
import { Calculator } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

function calcBMI(height: number, weight: number): number {
  if (height <= 0 || weight <= 0) return 0;
  return Math.round((weight / (height * height)) * 10000) / 10;
}

function getCategory(bmi: number): { label: string; color: string; bg: string } {
  if (bmi < 18.5)
    return { label: "Underweight", color: "oklch(0.7 0.15 230)", bg: "oklch(0.7 0.15 230 / 0.15)" };
  if (bmi < 25)
    return {
      label: "Healthy",
      color: "oklch(0.696 0.17 162.48)",
      bg: "oklch(0.696 0.17 162.48 / 0.15)",
    };
  if (bmi < 30)
    return { label: "Overweight", color: "oklch(0.78 0.18 80)", bg: "oklch(0.78 0.18 80 / 0.15)" };
  return { label: "Obese", color: "oklch(0.65 0.22 25)", bg: "oklch(0.65 0.22 25 / 0.15)" };
}

export default function BMICalculator() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const bmi = useMemo(
    () => calcBMI(parseFloat(height) || 0, parseFloat(weight) || 0),
    [height, weight],
  );
  const cat = useMemo(() => getCategory(bmi), [bmi]);

  return (
    <GlassCard variant="subtle" className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-xl bg-brand-teal/15 text-brand-teal">
          <Calculator className="size-4" />
        </div>
        <h3 className="font-display text-sm font-semibold">BMI Calculator</h3>
      </div>
      <FieldGroup className="gap-3">
        <div className="grid grid-cols-2 gap-2">
          <Field>
            <FieldLabel className="text-xs">Height (cm)</FieldLabel>
            <Input
              type="number"
              placeholder="170"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel className="text-xs">Weight (kg)</FieldLabel>
            <Input
              type="number"
              placeholder="70"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </Field>
        </div>
        {bmi > 0 && (
          <div className="rounded-xl p-3 text-center" style={{ background: cat.bg }}>
            <div
              className="font-display text-3xl font-extrabold tracking-tight"
              style={{ color: cat.color }}
            >
              {bmi}
            </div>
            <div className="text-xs font-semibold" style={{ color: cat.color }}>
              {cat.label}
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-overlay)]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min((bmi / 40) * 100, 100)}%`, background: cat.color }}
              />
            </div>
          </div>
        )}
      </FieldGroup>
    </GlassCard>
  );
}
