"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles } from "lucide-react";

export function ChallengeBadge({ earned, onClose }: { earned: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {earned && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <Trophy className="size-24 text-brand-amber drop-shadow-[0_0_30px_rgba(255,200,0,0.5)]" />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -inset-4"
              >
                <Sparkles className="size-full text-brand-amber/30" />
              </motion.div>
            </div>
            <h2 className="font-display text-2xl font-bold text-white">Challenge Complete!</h2>
            <p className="text-sm text-white/70">You earned a badge</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
