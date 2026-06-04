import { Flame, Beef, Wheat, Droplet } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { getTemplate } from "./templates";

interface RecipeData {
  title?: string;
  description?: string;
  ingredients?: { name: string; quantity: string }[];
  steps?: { text: string }[];
  calories?: string;
  protein?: string;
  carbs?: string;
  fat?: string;
}

export default function RecipeEmbed({ data }: { data: RecipeData }) {
  const tpl = getTemplate("WORKOUT");
  const ingredients = (data.ingredients || []).filter((i) => i.name || i.quantity);
  const steps = (data.steps || []).filter((s) => s.text);

  return (
    <GlassCard
      variant="subtle"
      className="relative overflow-hidden p-4 pl-5"
      style={{ boxShadow: `0 4px 16px -8px ${tpl.glow}` }}
    >
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5 rounded-l-2xl"
        style={{ background: tpl.accent }}
      />
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className="flex size-9 items-center justify-center rounded-2xl text-lg"
          style={{ background: `color-mix(in oklch, ${tpl.accent} 18%, transparent)` }}
        >
          🍽️
        </span>
        <div>
          <h3 className="font-display text-sm font-semibold" style={{ color: tpl.text }}>
            {data.title || "Recipe"}
          </h3>
          {data.description && <p className="text-xs text-muted-foreground">{data.description}</p>}
        </div>
      </div>

      {ingredients.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Ingredients
          </p>
          <ul className="space-y-0.5">
            {ingredients.map((ing, i) => (
              <li key={i} className="flex items-center gap-1.5 text-xs">
                <span className="size-1.5 rounded-full" style={{ background: tpl.accent }} />
                <span className="font-medium">{ing.quantity}</span>
                <span>{ing.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {steps.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Steps
          </p>
          <ol className="space-y-1">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-1.5 text-xs">
                <span className="mt-0.5 shrink-0 font-bold" style={{ color: tpl.text }}>
                  {i + 1}.
                </span>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {(data.calories || data.protein || data.carbs || data.fat) && (
        <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2 text-[10px]">
          {data.calories && (
            <span className="inline-flex items-center gap-1">
              <Flame className="size-3" />
              {data.calories} kcal
            </span>
          )}
          {data.protein && (
            <span className="inline-flex items-center gap-1">
              <Beef className="size-3" />
              {data.protein}g
            </span>
          )}
          {data.carbs && (
            <span className="inline-flex items-center gap-1">
              <Wheat className="size-3" />
              {data.carbs}g
            </span>
          )}
          {data.fat && (
            <span className="inline-flex items-center gap-1">
              <Droplet className="size-3" />
              {data.fat}g
            </span>
          )}
        </div>
      )}
    </GlassCard>
  );
}
