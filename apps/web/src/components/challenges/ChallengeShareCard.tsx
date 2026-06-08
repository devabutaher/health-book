"use client";

import { useState, useCallback } from "react";
import { Share2, CheckCircle, Flame, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Challenge } from "@/types/challenge";

export function ChallengeShareCard({
  challenge,
  progress,
}: {
  challenge: Challenge;
  progress: { score: number; goal: number; streak: number; completed: boolean } | null;
}) {
  const [capturing, setCapturing] = useState(false);

  const handleShare = useCallback(async () => {
    setCapturing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const element = document.getElementById("challenge-share-card");
      if (!element) return;

      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png"),
      );
      if (!blob) {
        toast.error("Failed to generate image");
        return;
      }

      const file = new File([blob], `challenge-${challenge.id}.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: challenge.title,
          text: `Check out my progress on "${challenge.title}"!`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `challenge-${challenge.id}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Image downloaded!");
      }
    } catch {
      toast.error("Failed to share");
    } finally {
      setCapturing(false);
    }
  }, [challenge]);

  return (
    <>
      {/* Hidden card for capture */}
      <div className="fixed -left-[9999px] top-0">
        <div
          id="challenge-share-card"
          className="relative flex w-[420px] flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl"
        >
          {/* Background decoration */}
          <div className="absolute -right-20 -top-20 size-60 rounded-full bg-brand-teal/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 size-60 rounded-full bg-brand-blue/10 blur-3xl" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-brand-amber" />
                <span className="text-xs font-semibold text-brand-amber/80 uppercase tracking-wider">
                  HealthBook Challenge
                </span>
              </div>
              {progress?.completed && (
                <span className="flex items-center gap-1 rounded-full bg-brand-teal/20 px-3 py-1 text-xs font-bold text-brand-teal">
                  <CheckCircle className="size-3.5" /> Completed
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="mt-3 text-2xl font-bold text-white leading-tight">{challenge.title}</h2>

            {/* Divider */}
            <div className="my-4 h-px bg-gradient-to-r from-brand-teal/40 via-white/10 to-transparent" />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-2xl font-bold text-white">{progress?.score ?? 0}</p>
                <p className="mt-0.5 text-[10px] text-white/60">Days Done</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Flame className="size-4 text-brand-amber" />
                  <p className="text-2xl font-bold text-white">{progress?.streak ?? 0}</p>
                </div>
                <p className="mt-0.5 text-[10px] text-white/60">Day Streak</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-2xl font-bold text-white">
                  {progress ? Math.round((progress.score / progress.goal) * 100) : 0}%
                </p>
                <p className="mt-0.5 text-[10px] text-white/60">Complete</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-teal to-brand-green transition-all"
                  style={{
                    width: `${progress ? Math.min((progress.score / progress.goal) * 100, 100) : 0}%`,
                  }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-white/40">
                <span>{challenge.type}</span>
                <span>{challenge.category?.replace("_", " ")}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
              <div className="flex items-center gap-2">
                <Target className="size-3.5 text-white/40" />
                <span className="text-[10px] text-white/40">
                  {challenge.participantCount} participant
                  {challenge.participantCount !== 1 ? "s" : ""}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-white/40">healthbook.app</span>
            </div>
          </div>
        </div>
      </div>

      {/* Share button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleShare}
        disabled={capturing}
        className="gap-1.5"
      >
        {capturing ? (
          <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Share2 className="size-3.5" />
        )}
        {capturing ? "Generating..." : "Share Progress"}
      </Button>
    </>
  );
}
