"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";

interface StoryCollapsiblePanelProps {
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function StoryCollapsiblePanel({
  collapsed,
  onToggle,
  children,
}: StoryCollapsiblePanelProps) {
  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 z-30 overflow-hidden rounded-t-2xl border-t border-white/10 bg-[#0a0a0a] backdrop-blur-xl"
      animate={{ height: collapsed ? 48 : "auto" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <button onClick={onToggle} className="relative flex w-full items-center justify-center py-3">
        <div className="h-1 w-10 rounded-full bg-white/20" />
        {collapsed ? (
          <ChevronUp className="absolute right-4 size-4 text-white/40" />
        ) : (
          <ChevronDown className="absolute right-4 size-4 text-white/40" />
        )}
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-h-[55vh] overflow-y-auto"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
