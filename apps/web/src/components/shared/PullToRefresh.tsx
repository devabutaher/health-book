"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function isInsideElement(target: EventTarget | null, attr: string): boolean {
  if (!target) return false;
  let el = target as HTMLElement | null;
  while (el) {
    if (el.hasAttribute(attr)) return true;
    el = el.parentElement;
  }
  return false;
}

export function PullToRefresh({
  onRefresh,
  disabled,
  children,
}: {
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [distance, setDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const THRESHOLD = 80;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (disabled) return;
    if (window.innerWidth >= 1024) return;

    const scrollContainer = (() => {
      let el: HTMLElement | null = containerRef.current;
      while (el) {
        const style = window.getComputedStyle(el);
        if (style.overflowY === "auto" || style.overflowY === "scroll") return el;
        el = el.parentElement;
      }
      return document.documentElement;
    })();

    let startY = 0;
    let isDragging = false;
    let isPulling = false;
    let currentDistance = 0;

    const onStart = (e: TouchEvent) => {
      if (isInsideElement(e.target, "data-story-viewer")) return;
      if (scrollContainer.scrollTop <= 0) {
        if (!scrollContainer.contains(e.target as Node)) return;
        startY = e.touches[0].clientY;
        isDragging = true;
      }
    };

    const onMove = (e: TouchEvent) => {
      if (isInsideElement(e.target, "data-story-viewer")) return;
      if (!isDragging) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > 20 && scrollContainer.scrollTop <= 0) {
        if (e.cancelable) e.preventDefault();
        isPulling = true;
        currentDistance = Math.min(dy * 0.5, THRESHOLD + 20);
        setPulling(true);
        setDistance(currentDistance);
      } else if (dy <= 0 && isPulling) {
        isPulling = false;
        isDragging = false;
        currentDistance = 0;
        setPulling(false);
        setDistance(0);
      }
    };

    const onEnd = async () => {
      if (!isDragging) return;
      isDragging = false;
      if (currentDistance >= THRESHOLD) {
        setRefreshing(true);
        try {
          await onRefresh();
        } catch {
          /* noop */
        }
        setRefreshing(false);
      }
      setPulling(false);
      setDistance(0);
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [onRefresh, disabled]);

  const progress = Math.min(distance / THRESHOLD, 1);
  const showHeart = pulling || refreshing;

  return (
    <div ref={containerRef} className="relative">
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: distance * 0.3 }}
            exit={{ opacity: 0, y: -20 }}
            className="pointer-events-none absolute left-1/2 top-2 z-50 -translate-x-1/2"
          >
            <div
              className="flex size-12 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-glow-teal)]"
              style={{ transform: `scale(${0.7 + progress * 0.3})` }}
            >
              {refreshing ? (
                <Heart className="size-5 animate-pulse text-brand-teal" fill="currentColor" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 100 100" className="overflow-visible">
                  <motion.path
                    d="M 10 50 L 25 50 L 30 30 L 35 70 L 40 50 L 50 50 L 55 20 L 60 80 L 65 50 L 90 50"
                    fill="none"
                    stroke="oklch(0.696 0.17 162.48)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: progress }}
                    transition={{ duration: 0.1 }}
                  />
                </svg>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}
