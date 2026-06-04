"use client";

import { useState } from "react";
import { Plus, X, Dumbbell } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { getTemplate } from "./templates";

interface Exercise {
  name: string;
  sets: number;
  reps: number;
}
export interface WorkoutData {
  activityType: string;
  duration: number;
  calories: number;
  exercises: Exercise[];
  intensity: number;
}

const activityTypes = [
  "Running",
  "Walking",
  "Cycling",
  "Swimming",
  "Gym",
  "Yoga",
  "Pilates",
  "HIIT",
  "Dance",
  "Sports",
  "Other",
];

export default function WorkoutForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: WorkoutData) => void;
  onCancel: () => void;
}) {
  const tpl = getTemplate("WORKOUT");
  const [data, setData] = useState<WorkoutData>({
    activityType: "",
    duration: 30,
    calories: 0,
    exercises: [],
    intensity: 5,
  });
  const [exercise, setExercise] = useState({ name: "", sets: 3, reps: 10 });

  const addExercise = () => {
    if (!exercise.name.trim()) return;
    setData((d) => ({ ...d, exercises: [...d.exercises, { ...exercise }] }));
    setExercise({ name: "", sets: 3, reps: 10 });
  };
  const removeExercise = (i: number) =>
    setData((d) => ({ ...d, exercises: d.exercises.filter((_, idx) => idx !== i) }));

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
          <p className="text-xs text-muted-foreground">Crush your workout 💪</p>
        </div>
      </div>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel className="text-sm">Activity Type</FieldLabel>
          <Select
            value={data.activityType}
            onValueChange={(v) => setData((d) => ({ ...d, activityType: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select activity..." />
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel className="text-sm">Duration (min)</FieldLabel>
            <Input
              type="number"
              min="1"
              max="480"
              value={data.duration}
              onChange={(e) => setData((d) => ({ ...d, duration: parseInt(e.target.value) || 0 }))}
            />
          </Field>
          <Field>
            <FieldLabel className="text-sm">Calories Burned</FieldLabel>
            <Input
              type="number"
              min="0"
              value={data.calories}
              onChange={(e) => setData((d) => ({ ...d, calories: parseInt(e.target.value) || 0 }))}
            />
          </Field>
        </div>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel className="text-sm">Intensity</FieldLabel>
            <span className="font-mono text-sm font-semibold" style={{ color: tpl.text }}>
              {data.intensity}/10
            </span>
          </div>
          <Slider
            min={1}
            max={10}
            step={1}
            value={[data.intensity]}
            onValueChange={([v]) => setData((d) => ({ ...d, intensity: v }))}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Easy</span>
            <span>Beast mode</span>
          </div>
        </Field>

        <Field>
          <FieldLabel className="text-sm">Exercises</FieldLabel>
          <AnimatePresence>
            <div className="mt-2 space-y-1.5">
              {data.exercises.map((e, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2 text-sm"
                >
                  <span className="font-medium">{e.name}</span>
                  <span className="text-muted-foreground">
                    {e.sets} × {e.reps}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="ml-auto"
                    onClick={() => removeExercise(i)}
                  >
                    <X />
                  </Button>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
          <div className="mt-2 flex flex-wrap gap-2">
            <Input
              placeholder="Exercise name"
              value={exercise.name}
              onChange={(e) => setExercise((ex) => ({ ...ex, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExercise())}
              className="flex-1"
            />
            <Input
              type="number"
              min="1"
              placeholder="Sets"
              value={exercise.sets}
              onChange={(e) =>
                setExercise((ex) => ({ ...ex, sets: parseInt(e.target.value) || 1 }))
              }
              className="w-16"
            />
            <Input
              type="number"
              min="1"
              placeholder="Reps"
              value={exercise.reps}
              onChange={(e) =>
                setExercise((ex) => ({ ...ex, reps: parseInt(e.target.value) || 1 }))
              }
              className="w-16"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addExercise}
              disabled={!exercise.name.trim()}
            >
              <Plus />
            </Button>
          </div>
        </Field>
      </FieldGroup>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit(data)} disabled={!data.activityType}>
          <Dumbbell /> Save Workout
        </Button>
      </div>
    </div>
  );
}
