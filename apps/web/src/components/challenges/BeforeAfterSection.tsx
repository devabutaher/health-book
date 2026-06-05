"use client";

import Image from "next/image";
import { Camera, Share2, Trophy, Calendar, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { toast } from "sonner";
import { useShareChallengeMutation } from "@/redux/api/challengesApi";
import type { BeforeAfter } from "@/types/challenge";

export function BeforeAfterSection({
  data,
  challengeId,
}: {
  data: BeforeAfter;
  challengeId: string;
}) {
  const [shareChallenge] = useShareChallengeMutation();

  const handleShare = async () => {
    try {
      const content =
        data.before && data.after
          ? `My before & after! Started day ${data.firstDay} → now day ${data.lastDay}`
          : `Check out my progress!`;
      await shareChallenge({ id: challengeId, content }).unwrap();
      toast.success("Shared to feed!");
    } catch {
      toast.error("Failed to share");
    }
  };

  return (
    <GlassCard variant="elevated" className="p-4 sm:p-5">
      <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-[var(--text-primary)]">
        <Camera className="size-4 text-brand-teal" />
        Before & After
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Before
          </p>
          <div className="aspect-square overflow-hidden rounded-xl bg-[var(--bg-subtle)]">
            {data.before ? (
              <Image
                src={data.before}
                alt="Before"
                className="size-full object-cover"
                width={400}
                height={400}
              />
            ) : (
              <div className="flex size-full items-center justify-center text-[var(--text-muted)]">
                <Camera className="size-8" />
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            After
          </p>
          <div className="aspect-square overflow-hidden rounded-xl bg-[var(--bg-subtle)]">
            {data.after ? (
              <Image
                src={data.after}
                alt="After"
                className="size-full object-cover"
                width={400}
                height={400}
              />
            ) : (
              <div className="flex size-full items-center justify-center text-[var(--text-muted)]">
                <Camera className="size-8" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-gradient-to-br from-brand-teal/10 to-brand-green/5 p-3 text-center">
          <Trophy className="mx-auto mb-1 size-4 text-brand-teal" />
          <p className="text-lg font-bold text-[var(--text-primary)]">{data.stats.totalDays}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Days Done</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-brand-amber/10 to-brand-coral/5 p-3 text-center">
          <Target className="mx-auto mb-1 size-4 text-brand-amber" />
          <p className="text-lg font-bold text-[var(--text-primary)]">
            {data.stats.completionRate}%
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Rate</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-brand-blue/10 to-brand-cyan/5 p-3 text-center">
          <Calendar className="mx-auto mb-1 size-4 text-brand-blue" />
          <p className="text-lg font-bold text-[var(--text-primary)]">{data.stats.bestStreak}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Best Streak</p>
        </div>
      </div>

      <Button variant="gradient" size="sm" onClick={handleShare} className="mt-4 w-full gap-1.5">
        <Share2 className="size-3.5" /> Share Before & After to Feed
      </Button>
    </GlassCard>
  );
}
