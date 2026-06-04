"use client";

import { X, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { StoryView } from "@/types/story";

export function StoryViewsSheet({ views, onClose }: { views: StoryView[]; onClose: () => void }) {
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
            <Eye className="size-4 text-brand-teal" />
            <span className="font-semibold">Views ({views.length})</span>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[var(--bg-overlay)]">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto">
          {views.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">No views yet</p>
          ) : (
            views.map((v) => (
              <div
                key={v.userId}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--bg-overlay)]"
              >
                <Avatar size="sm" className="size-9">
                  {v.user.avatar ? <AvatarImage src={v.user.avatar} alt={v.user.name} /> : null}
                  <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-xs text-white">
                    {v.user.name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {v.user.name}
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    Viewed {new Date(v.viewedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
