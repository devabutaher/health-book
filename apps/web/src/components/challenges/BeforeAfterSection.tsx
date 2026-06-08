"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { Camera, Share2, Trophy, Calendar, Target, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { getImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useSound } from "@/hooks/useSound";
import {
  useShareChallengeMutation,
  useUploadBeforePhotoMutation,
  useUploadAfterPhotoMutation,
  useUploadChallengeMediaMutation,
} from "@/redux/api/challengesApi";
import type { BeforeAfter } from "@/types/challenge";

export function BeforeAfterSection({
  data,
  challengeId,
  isCompleted,
}: {
  data: BeforeAfter;
  challengeId: string;
  isCompleted?: boolean;
}) {
  const [shareChallenge] = useShareChallengeMutation();
  const [uploadBefore] = useUploadBeforePhotoMutation();
  const [uploadAfter] = useUploadAfterPhotoMutation();
  const { play } = useSound();
  const [uploadMedia] = useUploadChallengeMediaMutation();
  const [isSubmitting, setIsSubmitting] = useState<"before" | "after" | null>(null);
  const [showBeforeUpload, setShowBeforeUpload] = useState(false);
  const [showAfterUpload, setShowAfterUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<"before" | "after">("before");

  const handleShare = async () => {
    try {
      const content =
        data.before && data.after
          ? `My before & after! Started day ${data.firstDay} → now day ${data.lastDay}`
          : `Check out my progress!`;
      await shareChallenge({ id: challengeId, content }).unwrap();
      play("success");
      toast.success("Shared to feed!");
    } catch (err) {
      play("error");
      toast.error(getErrorMessage(err, "Failed to share"));
    }
  };

  const triggerUpload = (mode: "before" | "after") => {
    setUploadMode(mode);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmitting(uploadMode);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const { url } = await uploadMedia(formData).unwrap();

      if (uploadMode === "before") {
        await uploadBefore({ challengeId, photoUrl: url }).unwrap();
        setShowBeforeUpload(false);
      } else {
        await uploadAfter({ challengeId, photoUrl: url }).unwrap();
        setShowAfterUpload(false);
      }
      play("success");
      toast.success(`${uploadMode === "before" ? "Before" : "After"} photo saved!`);
    } catch (err) {
      play("error");
      toast.error(getErrorMessage(err, "Upload failed"));
    } finally {
      setIsSubmitting(null);
      if (e.target) e.target.value = "";
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
          <div className="group relative aspect-square overflow-hidden rounded-xl bg-[var(--bg-subtle)]">
            {data.before ? (
              <Image
                src={getImageUrl(data.before, "q_auto:best,f_auto") ?? data.before}
                alt="Before"
                className="size-full object-cover"
                width={400}
                height={400}
                placeholder="blur"
                blurDataURL={
                  getImageUrl(data.before, "w_20,e_blur:2000,q_auto:low,f_auto") ?? undefined
                }
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                <Camera className="size-8" />
                {!showBeforeUpload && (
                  <button
                    onClick={() => setShowBeforeUpload(true)}
                    className="rounded-lg bg-[var(--bg-overlay)] px-3 py-1 text-xs font-semibold hover:bg-brand-teal/20 hover:text-brand-teal"
                  >
                    Add Photo
                  </button>
                )}
              </div>
            )}
            {showBeforeUpload && !data.before && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => triggerUpload("before")}
                  disabled={isSubmitting === "before"}
                  className="gap-1.5"
                >
                  <Upload className="size-3.5" />
                  {isSubmitting === "before" ? "Uploading..." : "Upload Before Photo"}
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            After
          </p>
          <div className="group relative aspect-square overflow-hidden rounded-xl bg-[var(--bg-subtle)]">
            {data.after ? (
              <Image
                src={getImageUrl(data.after, "q_auto:best,f_auto") ?? data.after}
                alt="After"
                className="size-full object-cover"
                width={400}
                height={400}
                placeholder="blur"
                blurDataURL={
                  getImageUrl(data.after, "w_20,e_blur:2000,q_auto:low,f_auto") ?? undefined
                }
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                <Camera className="size-8" />
                {isCompleted && !showAfterUpload && (
                  <button
                    onClick={() => setShowAfterUpload(true)}
                    className="rounded-lg bg-[var(--bg-overlay)] px-3 py-1 text-xs font-semibold hover:bg-brand-teal/20 hover:text-brand-teal"
                  >
                    Add Photo
                  </button>
                )}
                {!isCompleted && !data.after && (
                  <p className="px-2 text-center text-[10px] text-[var(--text-muted)]">
                    Complete the challenge to add your after photo
                  </p>
                )}
              </div>
            )}
            {showAfterUpload && !data.after && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => triggerUpload("after")}
                  disabled={isSubmitting === "after"}
                  className="gap-1.5"
                >
                  <Upload className="size-3.5" />
                  {isSubmitting === "after" ? "Uploading..." : "Upload After Photo"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />

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
