"use client";

import { X, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { StoryInteractions } from "@/types/story";

export function StoryInteractionsSheet({
  data,
  onClose,
}: {
  data: StoryInteractions;
  onClose: () => void;
}) {
  const emojiEntries = Object.entries(data.emojiBreakdown).sort(([, a], [, b]) => b - a);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false}>
        <DialogTitle className="sr-only">Story Interactions</DialogTitle>

        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-brand-teal" />
            <span className="font-semibold">{data.totalViews} Views</span>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[var(--bg-overlay)]">
            <X className="size-4" />
          </button>
        </div>

        {emojiEntries.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[var(--text-muted)]">
            {emojiEntries.map(([emoji, count]) => (
              <span key={emoji}>
                {emoji} {count}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: "40vh" }}>
          {data.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">No views yet</p>
          ) : (
            data.items.map((item) => (
              <div
                key={item.userId}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--bg-overlay)]"
              >
                <Avatar size="sm" className="size-9">
                  {item.user.avatar ? (
                    <AvatarImage src={item.user.avatar} alt={item.user.name} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-xs text-white">
                    {item.user.name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {item.user.name}
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {item.reaction
                      ? `Reacted ${new Date(item.viewedAt).toLocaleDateString()}`
                      : `Viewed ${new Date(item.viewedAt).toLocaleDateString()}`}
                  </p>
                </div>
                {item.reaction && <span className="text-xl">{item.reaction}</span>}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
