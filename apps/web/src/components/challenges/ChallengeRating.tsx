"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/getErrorMessage";

export function ChallengeRating({
  userRating,
  averageRating,
  ratingCount,
  onRate,
  disabled,
}: {
  userRating?: number | null;
  averageRating: number;
  ratingCount: number;
  onRate: (rating: number, review?: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const [saving, setSaving] = useState(false);
  const [review, setReview] = useState("");

  const handleRate = async (r: number) => {
    if (disabled || saving) return;
    setSaving(true);
    try {
      await onRate(r, review.trim() || undefined);
      toast.success("Rating submitted!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to submit rating"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-[var(--text-primary)]">Rate this Challenge</h4>
          {ratingCount > 0 && (
            <p className="text-[10px] text-[var(--text-muted)]">
              {averageRating.toFixed(1)} avg ({ratingCount} rating{ratingCount !== 1 ? "s" : ""})
            </p>
          )}
        </div>
        <div className="flex gap-0.5" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((star) => {
            const active = hovered ? star <= hovered : star <= (userRating ?? 0);
            return (
              <button
                key={star}
                type="button"
                disabled={disabled || saving}
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHovered(star)}
                className={cn(
                  "p-0.5 transition-all",
                  disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110",
                )}
              >
                <Star
                  className={cn(
                    "size-4 transition-colors",
                    active ? "fill-brand-amber text-brand-amber" : "text-[var(--text-muted)]",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Write a review (optional)..."
        rows={2}
        maxLength={1000}
        className="w-full resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
      />
    </div>
  );
}
