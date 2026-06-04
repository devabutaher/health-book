"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeAfterSliderProps {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export default function BeforeAfterSlider({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
  className,
}: BeforeAfterSliderProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  const onMouseDown = () => {
    dragging.current = true;
  };
  const onMouseUp = () => {
    dragging.current = false;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (dragging.current) updatePosition(e.clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    updatePosition(e.touches[0].clientX);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSliderPos((p) => Math.max(0, p - 4));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSliderPos((p) => Math.min(100, p + 4));
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-square w-full select-none overflow-hidden rounded-2xl",
        "border border-[var(--glass-border)] bg-[var(--bg-subtle)]",
        "shadow-[var(--shadow-md)]",
        className,
      )}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
    >
      <Image
        src={after}
        alt={afterLabel}
        fill
        sizes="(max-width: 768px) 100vw, 600px"
        className="object-cover"
        loading="eager"
      />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <Image
          src={before}
          alt={beforeLabel}
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-cover"
          loading="eager"
        />
      </div>

      <div
        className="absolute inset-y-0 z-10 cursor-col-resize"
        style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
        role="slider"
        tabIndex={0}
        aria-valuenow={Math.round(sliderPos)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Before/after comparison slider"
        onKeyDown={onKeyDown}
      >
        <div className="h-full w-0.5 bg-white/90 shadow-[0_0_8px_rgba(0,0,0,0.3)]" />
        <div
          className={cn(
            "absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2",
            "items-center justify-center rounded-full",
            "bg-gradient-to-br from-brand-teal to-brand-green text-white",
            "shadow-[0_0_20px_rgba(20,184,166,0.5)]",
            "ring-2 ring-white/40",
            "transition-transform active:scale-95",
          )}
        >
          <div className="flex items-center gap-0.5">
            <ChevronLeft className="size-3.5" />
            <ChevronRight className="size-3.5" />
          </div>
        </div>
      </div>

      <span
        className={cn(
          "absolute bottom-3 left-3 rounded-full",
          "bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white",
          "backdrop-blur-sm",
        )}
      >
        {beforeLabel}
      </span>
      <span
        className={cn(
          "absolute bottom-3 right-3 rounded-full",
          "bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white",
          "backdrop-blur-sm",
        )}
      >
        {afterLabel}
      </span>
    </div>
  );
}
