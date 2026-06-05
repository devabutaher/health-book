"use client";

import { AnimatePresence, motion } from "framer-motion";

const defaultEmojis = [
  "😀", "😂", "😍", "🥰", "😎", "🤔", "😢", "😡",
  "🔥", "💯", "❤️", "💔", "⭐", "🎉", "🎂", "🌈",
  "👍", "👎", "👏", "🙌", "💪", "🤝", "✌️", "🫶",
];

interface StoryEmojiGridProps {
  open: boolean;
  onSelect: (emoji: string) => void;
  emojis?: string[];
}

export function StoryEmojiGrid({ open, onSelect, emojis = defaultEmojis }: StoryEmojiGridProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-wrap gap-1.5 rounded-xl bg-white/10 p-2"
        >
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="flex size-8 items-center justify-center rounded-lg text-lg hover:bg-white/15"
            >
              {emoji}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
