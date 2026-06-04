"use client";

import Image from "next/image";
import type { StoryHighlight } from "@/types/story";
import { cn } from "@/lib/utils";

export function HighlightCircle({
  highlight,
  onClick,
}: {
  highlight: StoryHighlight;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 transition-opacity hover:opacity-80"
    >
      <div
        className={cn(
          "flex size-16 items-center justify-center overflow-hidden rounded-full ring-2 ring-brand-teal/40 ring-offset-2 ring-offset-[var(--bg-primary)]",
        )}
      >
        {highlight.coverUrl ? (
          <Image
            src={highlight.coverUrl}
            alt={highlight.title}
            className="size-full object-cover"
            width={64}
            height={64}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-brand-teal to-brand-green text-lg font-bold text-white">
            {highlight.title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <span className="max-w-16 truncate text-[11px] text-muted-foreground">{highlight.title}</span>
    </button>
  );
}
