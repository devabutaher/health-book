"use client";

import { Send } from "lucide-react";

interface StoryActionButtonsProps {
  onCancel: () => void;
  onShare: () => void;
  uploading: boolean;
  disabled: boolean;
  label: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export function StoryActionButtons({
  onCancel,
  onShare,
  uploading,
  disabled,
  label,
  gradientFrom = "from-brand-teal",
  gradientTo = "to-brand-green",
}: StoryActionButtonsProps) {
  return (
    <div className="flex gap-3 border-t border-white/10 p-3">
      <button
        onClick={onCancel}
        disabled={uploading}
        className="flex-1 rounded-full bg-white/10 py-3 font-semibold text-white hover:bg-white/20 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        onClick={onShare}
        disabled={uploading || disabled}
        className={`flex-1 rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo} py-3 font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50`}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Sharing...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Send className="size-4" /> {label}
          </div>
        )}
      </button>
    </div>
  );
}
