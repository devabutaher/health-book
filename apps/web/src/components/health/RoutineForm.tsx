"use client";

import { useState } from "react";
import { Moon, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTemplate } from "./templates";

export interface RoutineData {
  wakeTime: string;
  sleepTime: string;
  meals: { type: string; description: string }[];
  waterIntake: number;
  screenTime: number;
}

export default function RoutineForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: RoutineData) => void;
  onCancel: () => void;
}) {
  const tpl = getTemplate("ROUTINE");
  const [data, setData] = useState<RoutineData>({
    wakeTime: "",
    sleepTime: "",
    meals: [],
    waterIntake: 0,
    screenTime: 0,
  });
  const [mealInput, setMealInput] = useState({ type: "breakfast", description: "" });

  const addMeal = () => {
    if (!mealInput.description.trim()) return;
    setData((d) => ({ ...d, meals: [...d.meals, { ...mealInput }] }));
    setMealInput({ type: "breakfast", description: "" });
  };
  const removeMeal = (i: number) =>
    setData((d) => ({ ...d, meals: d.meals.filter((_, idx) => idx !== i) }));

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
          <p className="text-xs text-muted-foreground">Track your daily habits</p>
        </div>
      </div>
      <FieldGroup className="gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel className="text-sm">Wake-up Time</FieldLabel>
            <Input
              type="time"
              value={data.wakeTime}
              onChange={(e) => setData((d) => ({ ...d, wakeTime: e.target.value }))}
            />
          </Field>
          <Field>
            <FieldLabel className="text-sm">Sleep Time</FieldLabel>
            <Input
              type="time"
              value={data.sleepTime}
              onChange={(e) => setData((d) => ({ ...d, sleepTime: e.target.value }))}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel className="text-sm">Meals</FieldLabel>
          <AnimatePresence>
            {data.meals.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2 text-sm"
              >
                <span
                  className="rounded-md px-1.5 py-0.5 text-xs font-medium uppercase"
                  style={{
                    background: `color-mix(in oklch, ${tpl.accent} 18%, transparent)`,
                    color: tpl.text,
                  }}
                >
                  {m.type}
                </span>
                <span className="flex-1">{m.description}</span>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeMeal(i)}>
                  <X />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="mt-2 flex gap-2">
            <Select
              value={mealInput.type}
              onValueChange={(v) => setMealInput((m) => ({ ...m, type: v }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="What did you eat?"
              value={mealInput.description}
              onChange={(e) => setMealInput((m) => ({ ...m, description: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMeal())}
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={addMeal}>
              <Plus /> Add
            </Button>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel className="text-sm">Water Intake</FieldLabel>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2 py-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  setData((d) => ({ ...d, waterIntake: Math.max(0, d.waterIntake - 1) }))
                }
              >
                -
              </Button>
              <span className="flex-1 text-center font-display text-base font-semibold">
                {data.waterIntake}
              </span>
              <span className="text-xs text-muted-foreground">glasses</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setData((d) => ({ ...d, waterIntake: d.waterIntake + 1 }))}
              >
                +
              </Button>
            </div>
          </Field>
          <Field>
            <FieldLabel className="text-sm">Screen Time</FieldLabel>
            <Input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={data.screenTime}
              onChange={(e) =>
                setData((d) => ({ ...d, screenTime: parseFloat(e.target.value) || 0 }))
              }
            />
          </Field>
        </div>
      </FieldGroup>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit(data)} disabled={!data.wakeTime || !data.sleepTime}>
          <Moon className="size-4" /> Save Routine
        </Button>
      </div>
    </div>
  );
}
