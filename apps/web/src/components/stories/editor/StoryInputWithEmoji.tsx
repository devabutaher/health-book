"use client";

import { Smile } from "lucide-react";

interface StoryInputWithEmojiProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength: number;
  showEmoji: boolean;
  onEmojiToggle: () => void;
  focusColor?: string;
}

export function StoryInputWithEmoji({
  value,
  onChange,
  placeholder,
  maxLength,
  onEmojiToggle,
  focusColor = "focus:ring-brand-teal",
}: StoryInputWithEmojiProps) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full rounded-xl bg-white/15 px-4 py-3 pr-20 text-white placeholder:text-white/50 outline-none focus:ring-2 ${focusColor}`}
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
        <button
          onClick={onEmojiToggle}
          className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
        >
          <Smile className="size-4" />
        </button>
        {value && (
          <span className="self-center text-xs text-white/50">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
