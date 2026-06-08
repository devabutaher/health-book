"use client";

import { motion } from "framer-motion";
import { useToggleReactionMutation } from "@/redux/api/postApi";
import { cn } from "@/lib/utils";
import { popReaction } from "@/lib/motion/variants";
import { useSound } from "@/hooks/useSound";

const REACTIONS = [
  { type: "INSPIRED" as const, label: "Inspired", icon: "🔥" },
  { type: "CLAP" as const, label: "Clap", icon: "👏" },
  { type: "KEEP_IT_UP" as const, label: "Keep it up", icon: "💪" },
  { type: "HEALING" as const, label: "Healing", icon: "🩹" },
  { type: "LOVE" as const, label: "Love", icon: "❤️" },
] as const;

type ReactionType = (typeof REACTIONS)[number]["type"];

export function ReactionBar({
  postId,
  userReaction,
  onReaction,
}: {
  postId: string;
  userReaction?: string | null;
  onReaction?: (type: ReactionType) => void;
}) {
  const [toggle] = useToggleReactionMutation();
  const { play } = useSound();

  const handleReact = (type: ReactionType) => {
    play("reaction");
    if (onReaction) {
      onReaction(type);
    } else {
      toggle({ postId, type });
    }
  };

  return (
    <div className="flex items-center gap-1">
      {REACTIONS.map((r) => {
        const isActive = userReaction === r.type;
        return (
          <motion.button
            key={r.type}
            {...popReaction}
            onClick={() => handleReact(r.type)}
            aria-label={r.label}
            aria-pressed={isActive}
            className={cn(
              "flex items-center justify-center rounded-xl p-2 text-xl transition-colors",
              isActive
                ? "bg-gradient-to-r from-brand-teal/20 to-brand-green/20 border border-brand-teal/30"
                : "hover:bg-[var(--bg-overlay)]",
            )}
          >
            <motion.span
              animate={
                isActive
                  ? { scale: [1, 1.4, 0.9, 1.1, 1], rotate: [0, -10, 10, -5, 0] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="inline-flex"
            >
              {r.icon}
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
}
