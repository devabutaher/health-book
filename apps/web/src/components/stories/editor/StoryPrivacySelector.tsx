"use client";

import { cn } from "@/lib/utils";

type Privacy = "public" | "friends" | "private";

interface StoryPrivacySelectorProps {
  value: Privacy;
  onChange: (value: Privacy) => void;
  activeColor?: string;
}

const options: { value: Privacy; label: string; icon: string }[] = [
  { value: "public", label: "Public", icon: "🌍" },
  { value: "friends", label: "Friends", icon: "👥" },
  { value: "private", label: "Only Me", icon: "🔒" },
];

export function StoryPrivacySelector({
  value,
  onChange,
  activeColor = "bg-brand-teal",
}: StoryPrivacySelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-white/70">Who can see</span>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-all",
              value === opt.value
                ? `${activeColor} text-white`
                : "bg-white/10 text-white/70 hover:bg-white/20",
            )}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
