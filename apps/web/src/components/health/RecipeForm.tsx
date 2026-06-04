"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { getTemplate } from "./templates";

interface Ingredient {
  name: string;
  quantity: string;
}
interface Step {
  text: string;
}

export default function RecipeForm({
  data,
  onChange,
  content,
  onContentChange,
}: {
  data: Record<string, unknown> | null;
  onChange: (data: Record<string, unknown>) => void;
  content: string;
  onContentChange: (v: string) => void;
}) {
  const tpl = getTemplate("WORKOUT");
  const [title, setTitle] = useState((data?.title as string) || "");
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    (data?.ingredients as Ingredient[]) || [{ name: "", quantity: "" }],
  );
  const [steps, setSteps] = useState<Step[]>((data?.steps as Step[]) || [{ text: "" }]);
  const [calories, setCalories] = useState((data?.calories as string) || "");
  const [protein, setProtein] = useState((data?.protein as string) || "");
  const [carbs, setCarbs] = useState((data?.carbs as string) || "");
  const [fat, setFat] = useState((data?.fat as string) || "");

  const sync = (u: Record<string, unknown>) =>
    onChange({
      title: u.title !== undefined ? u.title : title,
      ingredients: u.ingredients !== undefined ? u.ingredients : ingredients,
      steps: u.steps !== undefined ? u.steps : steps,
      calories: u.calories !== undefined ? u.calories : calories,
      protein: u.protein !== undefined ? u.protein : protein,
      carbs: u.carbs !== undefined ? u.carbs : carbs,
      fat: u.fat !== undefined ? u.fat : fat,
    });

  return (
    <GlassCard
      variant="subtle"
      className="relative overflow-hidden p-4 pl-5"
      style={{ boxShadow: `0 4px 24px -8px ${tpl.glow}` }}
    >
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5 rounded-l-2xl"
        style={{ background: tpl.accent }}
      />
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel className="font-display text-sm">Recipe Title</FieldLabel>
          <Input
            placeholder="e.g. Post-Workout Smoothie"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              sync({ title: e.target.value });
            }}
          />
        </Field>

        <Field>
          <FieldLabel className="text-sm">Story / Description</FieldLabel>
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Brief description or story..."
            className="w-full resize-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground/60 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
            rows={2}
            maxLength={2000}
          />
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel className="text-sm">Ingredients</FieldLabel>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                const next = [...ingredients, { name: "", quantity: "" }];
                setIngredients(next);
                sync({ ingredients: next });
              }}
            >
              <Plus /> Add
            </Button>
          </div>
          <FieldGroup className="mt-2 gap-1.5">
            <AnimatePresence>
              {ingredients.map((ing, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-1.5"
                >
                  <Input
                    placeholder="Name"
                    value={ing.name}
                    onChange={(e) => {
                      const next = ingredients.map((x, idx) =>
                        idx === i ? { ...x, name: e.target.value } : x,
                      );
                      setIngredients(next);
                      sync({ ingredients: next });
                    }}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Qty"
                    value={ing.quantity}
                    onChange={(e) => {
                      const next = ingredients.map((x, idx) =>
                        idx === i ? { ...x, quantity: e.target.value } : x,
                      );
                      setIngredients(next);
                      sync({ ingredients: next });
                    }}
                    className="w-20"
                  />
                  {ingredients.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        const next = ingredients.filter((_, idx) => idx !== i);
                        setIngredients(next);
                        sync({ ingredients: next });
                      }}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </FieldGroup>
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel className="text-sm">Steps</FieldLabel>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                const next = [...steps, { text: "" }];
                setSteps(next);
                sync({ steps: next });
              }}
            >
              <Plus /> Add
            </Button>
          </div>
          <FieldGroup className="mt-2 gap-1.5">
            <AnimatePresence>
              {steps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-1.5"
                >
                  <span className="mt-2 text-xs font-bold text-muted-foreground">{i + 1}.</span>
                  <Input
                    placeholder={`Step ${i + 1}`}
                    value={s.text}
                    onChange={(e) => {
                      const next = steps.map((x, idx) =>
                        idx === i ? { text: e.target.value } : x,
                      );
                      setSteps(next);
                      sync({ steps: next });
                    }}
                    className="flex-1"
                  />
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        const next = steps.filter((_, idx) => idx !== i);
                        setSteps(next);
                        sync({ steps: next });
                      }}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </FieldGroup>
        </Field>

        <Field>
          <FieldLabel className="text-sm">Nutrition (per serving, optional)</FieldLabel>
          <FieldDescription className="text-xs">
            Helps followers understand the macros.
          </FieldDescription>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[
              {
                field: "calories" as const,
                val: calories,
                set: setCalories,
                unit: "kcal",
                label: "Calories",
              },
              {
                field: "protein" as const,
                val: protein,
                set: setProtein,
                unit: "g",
                label: "Protein",
              },
              { field: "carbs" as const, val: carbs, set: setCarbs, unit: "g", label: "Carbs" },
              { field: "fat" as const, val: fat, set: setFat, unit: "g", label: "Fat" },
            ].map(({ field, val, set, unit, label }) => (
              <div key={field} className="space-y-0.5">
                <FieldLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {label}
                </FieldLabel>
                <Input
                  type="number"
                  placeholder={unit}
                  value={val}
                  onChange={(e) => {
                    set(e.target.value);
                    sync({ [field]: e.target.value });
                  }}
                  className="h-9 text-sm"
                />
              </div>
            ))}
          </div>
        </Field>
      </FieldGroup>
    </GlassCard>
  );
}
