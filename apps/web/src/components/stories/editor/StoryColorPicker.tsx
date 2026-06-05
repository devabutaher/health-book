"use client";

import { cn } from "@/lib/utils";

interface ColorSwatch {
  color: string;
  label: string;
}

interface StoryColorPickerProps {
  label: string;
  colors: ColorSwatch[];
  value: string;
  onChange: (color: string) => void;
  swatchSize?: "sm" | "md";
}

export function StoryColorPicker({
  label,
  colors,
  value,
  onChange,
  swatchSize = "sm",
}: StoryColorPickerProps) {
  const sizeClass = swatchSize === "sm" ? "size-7" : "size-8";

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/70">{label}</label>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {colors.map((c) => (
          <button
            key={c.color}
            onClick={() => onChange(c.color)}
            className={cn(
              `${sizeClass} shrink-0 rounded-full border-2 transition-all`,
              value === c.color
                ? "scale-110 border-white shadow-lg"
                : "border-transparent hover:scale-105",
            )}
            style={{ backgroundColor: c.color }}
            title={c.label}
          />
        ))}
        <label
          className={cn(
            "relative shrink-0 cursor-pointer rounded-full border-2 border-dashed border-white/30 bg-white/5 transition-colors hover:bg-white/15",
            sizeClass,
          )}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <span className="flex h-full items-center justify-center text-[10px] text-white/50">
            +
          </span>
        </label>
      </div>
    </div>
  );
}
