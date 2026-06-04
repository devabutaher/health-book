"use client";

import { useState } from "react";
import { X, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { StoryReaction } from "@/types/story";

interface Props {
  reactions: StoryReaction[];
  onClose: () => void;
}

export function StoryReactionsSheet({ reactions, onClose }: Props) {
  const emojis = [...new Set(reactions.map((r) => r.emoji))];
  const [selected, setSelected] = useState<string | null>(null);
  const activeEmoji = selected || emojis[0] || "";
  const filtered = activeEmoji ? reactions.filter((r) => r.emoji === activeEmoji) : reactions;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="max-h-[60vh] w-full max-w-sm rounded-t-2xl bg-[var(--bg-elevated)] p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="size-4 text-red-400" />
            <span className="font-semibold">Reactions ({reactions.length})</span>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[var(--bg-overlay)]">
            <X className="size-4" />
          </button>
        </div>

        {emojis.length > 0 && (
          <div className="mb-3 flex gap-1.5 overflow-x-auto">
            {emojis.map((emoji) => {
              const count = reactions.filter((r) => r.emoji === emoji).length;
              return (
                <button
                  key={emoji}
                  onClick={() => setSelected(selected === emoji ? null : emoji)}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors",
                    activeEmoji === emoji
                      ? "bg-brand-teal/20 text-brand-teal"
                      : "bg-[var(--bg-overlay)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                  )}
                >
                  <span className="text-lg">{emoji}</span>
                  <span className="text-xs font-semibold">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">No reactions yet</p>
          ) : (
            filtered.map((r) => (
              <div
                key={r.userId + r.emoji}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--bg-overlay)]"
              >
                <Avatar size="sm" className="size-9">
                  {r.user.avatar ? <AvatarImage src={r.user.avatar} alt={r.user.name} /> : null}
                  <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-xs text-white">
                    {r.user.name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {r.user.name}
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    Reacted {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xl">{r.emoji}</span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
