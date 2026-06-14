"use client";

import { useAddHighlightItemMutation, useGetHighlightsQuery } from "@/redux/api/highlightsApi";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface StoryHighlightPanelProps {
  createdStoryId: string;
  onClose: () => void;
  onCreated?: () => void;
}

export function StoryHighlightPanel({
  createdStoryId,
  onClose,
  onCreated,
}: StoryHighlightPanelProps) {
  const { data: highlights, isLoading, isError, refetch } = useGetHighlightsQuery();
  const [addHighlightItem] = useAddHighlightItemMutation();

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="absolute inset-x-0 bottom-0 z-30 rounded-t-2xl border-t border-white/10 bg-[#0a0a0a] p-4 backdrop-blur-xl"
    >
      <h3 className="mb-3 text-center text-sm font-semibold text-white">Save to Highlight?</h3>
        <div className="mb-3 flex max-h-32 flex-wrap justify-center gap-2 overflow-y-auto">
          {isLoading ? (
            <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : isError ? (
            <div className="text-center">
              <p className="text-xs text-white/50">Failed to load</p>
              <button onClick={refetch} className="text-xs text-brand-teal underline">Retry</button>
            </div>
          ) : highlights && highlights.length > 0 ? (
          highlights.map((hl) => (
            <button
              key={hl.id}
              onClick={async () => {
                try {
                  await addHighlightItem({
                    highlightId: hl.id,
                    storyId: createdStoryId,
                  }).unwrap();
                  toast.success(`Added to ${hl.title}`);
                  onCreated?.();
                  onClose();
                } catch {
                  toast.error("Failed to add to highlight");
                }
              }}
              className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/25"
            >
              {hl.title}
            </button>
          ))
        ) : (
          <p className="text-center text-sm text-white/50">
            No highlights yet{/* . Create one from your profile. */}
          </p>
        )}
      </div>
      <button
        onClick={() => {
          onCreated?.();
          onClose();
        }}
        className="w-full rounded-full bg-white/20 py-3 text-sm font-semibold text-white hover:bg-white/30"
      >
        Skip
      </button>
    </motion.div>
  );
}
