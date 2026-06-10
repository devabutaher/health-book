"use client";

import { Star, MessageSquare } from "lucide-react";
import { useGetRatingsQuery } from "@/redux/api/challengesApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function ChallengeReviewsList({ challengeId }: { challengeId: string }) {
  const { data, isLoading } = useGetRatingsQuery(challengeId);

  if (isLoading) return null;

  const reviews = (data?.ratings ?? []).filter((r) => r.review);

  if (reviews.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-card)]">
      <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
        <MessageSquare className="size-3.5" /> Reviews ({reviews.length})
      </h4>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-lg bg-[var(--bg-subtle)] p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <Link href={`/profile/${r.user.username}`}>
                <Avatar className="size-6">
                  <AvatarImage src={r.user.avatar || undefined} />
                  <AvatarFallback className="text-[9px]">
                    {(r.user.name || r.user.username)[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <Link
                  href={`/profile/${r.user.username}`}
                  className="text-[11px] font-semibold text-[var(--text-primary)] hover:underline"
                >
                  {r.user.name || r.user.username}
                </Link>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "size-3",
                      star <= r.rating
                        ? "fill-brand-amber text-brand-amber"
                        : "text-[var(--text-muted)]",
                    )}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">{r.review}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
