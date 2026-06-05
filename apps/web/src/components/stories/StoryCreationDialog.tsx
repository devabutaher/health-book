"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, type ReactNode } from "react";

interface StoryCreationDialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  showClose?: boolean;
}

export function StoryCreationDialog({
  open,
  onClose,
  children,
  showClose = true,
}: StoryCreationDialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div className="relative aspect-[9/16] h-full max-h-[90vh] w-full max-w-sm overflow-hidden rounded-2xl">
            {showClose && (
              <button
                onClick={onClose}
                className="absolute right-3 top-3 z-30 rounded-full bg-white/10 p-2 text-white/50 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            )}
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
