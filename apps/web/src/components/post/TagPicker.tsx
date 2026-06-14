"use client";

import { useState, forwardRef, useImperativeHandle, memo, useCallback } from "react";
import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURATED_TAGS } from "@/lib/constants";

export interface TagPickerHandle {
  getTags(): string[];
  reset(): void;
}

interface TagPickerProps {
  initialTags?: string[];
}

export const TagPicker = memo(
  forwardRef<TagPickerHandle, TagPickerProps>(function TagPicker({ initialTags }, ref) {
    const [selectedTags, setSelectedTags] = useState<string[]>(initialTags ?? []);
    const [showTags, setShowTags] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        getTags: () => selectedTags,
        reset: () => setSelectedTags([]),
      }),
      [selectedTags],
    );

    const toggleTag = useCallback((tag: string) => {
      setSelectedTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
      );
    }, []);

    return (
      <>
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-teal to-brand-green px-2 py-0.5 text-[10px] font-medium text-white transition-opacity hover:opacity-80"
              >
                #{tag}
                <span className="text-white/70">✕</span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowTags((prev) => !prev)}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border border-[var(--glass-border)] px-3 py-1.5 text-xs transition-colors",
            selectedTags.length > 0
              ? "bg-brand-teal/5 border-brand-teal/20"
              : "hover:bg-[var(--bg-overlay)] hover:border-brand-teal/30",
          )}
        >
          <div className="flex items-center gap-2">
            <Hash className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">
              {selectedTags.length > 0 ? `Tags (${selectedTags.length})` : "Add tags"}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {selectedTags.length > 0 && (
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTags([]);
                }}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </span>
            )}
            <span className="text-muted-foreground text-base">{showTags ? "▴" : "▸"}</span>
          </div>
        </button>

        {showTags && (
          <div className="flex flex-wrap gap-1">
            {CURATED_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium transition-all",
                    active
                      ? "bg-gradient-to-r from-brand-teal to-brand-green text-white"
                      : "border border-[var(--glass-border)] bg-[var(--bg-overlay)] text-muted-foreground hover:border-brand-teal/40 hover:text-brand-teal",
                  )}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
      </>
    );
  }),
);
