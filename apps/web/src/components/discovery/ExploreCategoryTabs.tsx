"use client";

import { cn } from "@/lib/utils";

const categories = [
  { id: "all", label: "All" },
  { id: "fitness", label: "Fitness" },
  { id: "nutrition", label: "Nutrition" },
  { id: "mental-health", label: "Mental Health" },
  { id: "yoga", label: "Yoga" },
  { id: "meditation", label: "Meditation" },
];

export function ExploreCategoryTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
            active === cat.id
              ? "bg-gradient-to-r from-brand-teal to-brand-green text-white shadow-[var(--shadow-glow-teal)]"
              : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]",
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
