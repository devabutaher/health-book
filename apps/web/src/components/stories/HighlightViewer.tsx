"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Pause, Play, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from "@/lib/utils";
import { useRemoveHighlightItemMutation } from "@/redux/api/highlightsApi";
import type { StoryHighlight } from "@/types/story";
import { toast } from "sonner";

export function HighlightViewer({
  highlights,
  initialIndex,
  onClose,
}: {
  highlights: StoryHighlight[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [hlIdx, setHlIdx] = useState(initialIndex);
  const [itemIdx, setItemIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [removeItem] = useRemoveHighlightItemMutation();

  const highlight = highlights[hlIdx];
  const items = highlight?.items || [];
  const currentItem = items[itemIdx];
  const duration = 5000;

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(0);
    progressRef.current = 0;
  }, []);

  const goNext = useCallback(() => {
    resetTimer();
    if (itemIdx < items.length - 1) {
      setItemIdx((i) => i + 1);
    } else if (hlIdx < highlights.length - 1) {
      setHlIdx((h) => h + 1);
      setItemIdx(0);
    } else {
      onClose();
    }
  }, [itemIdx, items.length, hlIdx, highlights.length, resetTimer, onClose]);

  const startTimer = useCallback(() => {
    const interval = 50;
    const steps = duration / interval;
    let step = 0;
    timerRef.current = setInterval(() => {
      step++;
      const pct = Math.min((step / steps) * 100, 100);
      progressRef.current = pct;
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current!);
        goNext();
      }
    }, interval);
  }, [duration, goNext]);

  const goPrev = useCallback(() => {
    resetTimer();
    if (itemIdx > 0) {
      setItemIdx((i) => i - 1);
    } else if (hlIdx > 0) {
      setHlIdx((h) => h - 1);
      setItemIdx(highlights[hlIdx - 1]?.items.length - 1 || 0);
    }
  }, [itemIdx, hlIdx, highlights, resetTimer]);

  useEffect(() => {
    if (!paused && items.length > 0) startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [itemIdx, hlIdx, paused, items.length, startTimer]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  const handleRemove = async () => {
    if (!currentItem) return;
    try {
      await removeItem({ highlightId: highlight.id, itemId: currentItem.id }).unwrap();
      toast.success("Removed from highlight");
      goNext();
    } catch {
      toast.error("Failed to remove");
    }
  };

  if (!highlight || !currentItem) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
        onClick={onClose}
      >
        <div
          className="relative h-full w-full max-w-lg overflow-hidden sm:h-[90vh] sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bars */}
          <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 p-2">
            {items.map((item, i) => (
              <div key={item.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
                <div
                  className="h-full rounded-full bg-white transition-all duration-100 ease-linear"
                  style={{
                    width: i < itemIdx ? "100%" : i === itemIdx ? `${progress}%` : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header info */}
          <div className="absolute left-0 right-0 top-6 z-20 flex items-center justify-between px-3">
            <span className="text-sm font-semibold text-white drop-shadow-lg">
              {highlight.title}
            </span>
            <button
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Media */}
          <div className="flex size-full items-center justify-center bg-black">
            {currentItem.story?.mediaType === "video" ? (
              <video
                src={currentItem.story?.mediaUrl}
                className="max-h-full max-w-full object-contain"
                autoPlay
                playsInline
              />
            ) : (
              <Image
                src={
                  getImageUrl(currentItem.story?.mediaUrl, "q_auto:best,f_auto") ??
                  currentItem.story?.mediaUrl ??
                  ""
                }
                alt={highlight.title}
                className="max-h-full max-w-full object-contain"
                width={400}
                height={700}
                priority
                placeholder="blur"
                blurDataURL={
                  getImageUrl(currentItem.story?.mediaUrl, "w_20,e_blur:2000,q_auto:low,f_auto") ??
                  undefined
                }
              />
            )}
          </div>

          {/* Navigation buttons */}
          {(itemIdx > 0 || hlIdx > 0) && (
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}
          {(itemIdx < items.length - 1 || hlIdx < highlights.length - 1) && (
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
            >
              <ChevronRight className="size-6" />
            </button>
          )}

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-3 p-4">
            <button
              onClick={() => setPaused((p) => !p)}
              className="flex size-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
            >
              {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
            </button>
            <button
              onClick={handleRemove}
              className="flex size-10 items-center justify-center rounded-full bg-red-500/30 text-white backdrop-blur-sm transition-colors hover:bg-red-500/50"
              title="Remove from highlight"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
