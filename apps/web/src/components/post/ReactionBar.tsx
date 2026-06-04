"use client";

import { motion } from "framer-motion";
import { useToggleReactionMutation } from "@/redux/api/postApi";
import { cn } from "@/lib/utils";
import { popReaction } from "@/lib/motion/variants";
import { useSound } from "@/hooks/useSound";

const REACTIONS = [
  { type: "INSPIRED", label: "Inspired", icon: "🔥" },
  { type: "CLAP", label: "Clap", icon: "👏" },
  { type: "KEEP_IT_UP", label: "Keep it up", icon: "💪" },
  { type: "HEALING", label: "Healing", icon: "🩹" },
  { type: "LOVE", label: "Love", icon: "❤️" },
] as const;

export function ReactionBar({
  postId,
  userReaction,
}: {
  postId: string;
  userReaction?: string | null;
}) {
  const [toggle] = useToggleReactionMutation();
  const { play } = useSound();

  const handleReact = async (type: "INSPIRED" | "CLAP" | "KEEP_IT_UP" | "HEALING" | "LOVE") => {
    play("reaction");
    await toggle({ postId, type });
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
