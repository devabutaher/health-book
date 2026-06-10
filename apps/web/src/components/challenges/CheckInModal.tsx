"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { X, Check, Camera, Upload, SkipForward, ArrowLeft } from "lucide-react";
import { useCheckInMutation, useUploadChallengeMediaMutation } from "@/redux/api/challengesApi";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { scaleIn } from "@/lib/motion/variants";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useSound } from "@/hooks/useSound";
import type { ChallengeDayPlan } from "@/types/challenge";
import { useEffect } from "react";
export function CheckInModal({
  challengeId,
  currentDay,
  totalDays,
  open,
  onClose,
  dayPlan,
  goalTarget,
  goalUnit,
  hasDayPlans,
  dayNumber,
  existingEntry,
}: {
  challengeId: string;
  currentDay: number;
  totalDays: number;
  open: boolean;
  onClose: () => void;
  dayPlan?: ChallengeDayPlan | null;
  goalTarget?: number | null;
  goalUnit?: string | null;
  hasDayPlans?: boolean;
  dayNumber?: number;
  existingEntry?: {
    dayNumber: number;
    notes?: string | null;
    mediaUrls: string[];
    value?: number | null;
    sharedToFeed: boolean;
  } | null;
}) {
  const [notes, setNotes] = useState("");
  const [mediaPreviews, setMediaPreviews] = useState<
    Array<{
      id: string;
      localUrl: string;
      remoteUrl?: string;
      uploading: boolean;
      error?: boolean;
    }>
  >([]);
  const [sharedToFeed, setSharedToFeed] = useState(false);
  const [value, setValue] = useState<number | "">("");
  const [checkIn, { isLoading }] = useCheckInMutation();
  const [uploadMedia] = useUploadChallengeMediaMutation();
  const { play } = useSound();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const isSubmitting = uploading || isLoading;

  // The day to check in — if dayNumber is provided explicitly (e.g. calendar click), use it
  const targetDay = dayNumber ?? currentDay;
  const isBackfill = dayNumber != null && dayNumber < currentDay;
  const isDone = currentDay > totalDays;

  const isEditing = existingEntry != null;

  const showValueInput = goalTarget != null && goalUnit != null;

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const id = Date.now().toString();
    const localUrl = URL.createObjectURL(file);

    // Show local preview immediately
    setMediaPreviews((prev) => [...prev, { id, localUrl, uploading: true }]);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const { url } = await uploadMedia(formData).unwrap();
      // Replace local preview with remote URL
      setMediaPreviews((prev) =>
        prev.map((m) => (m.id === id ? { ...m, remoteUrl: url, uploading: false } : m)),
      );
    } catch (err) {
      setMediaPreviews((prev) =>
        prev.map((m) => (m.id === id ? { ...m, uploading: false, error: true } : m)),
      );
      toast.error(getErrorMessage(err, "Upload failed"));
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const removeMedia = (id: string) => {
    const item = mediaPreviews.find((m) => m.id === id);
    if (item) URL.revokeObjectURL(item.localUrl);
    setMediaPreviews((prev) => prev.filter((m) => m.id !== id));
  };

  // Pre-fill fields when editing an existing entry
  useEffect(() => {
    if (open && existingEntry) {
      setNotes(existingEntry.notes ?? "");
      setSharedToFeed(existingEntry.sharedToFeed);
      setValue(existingEntry.value ?? "");
      setMediaPreviews(
        existingEntry.mediaUrls.map((url) => ({
          id: `existing-${url}`,
          localUrl: url,
          remoteUrl: url,
          uploading: false,
        })),
      );
    }
  }, [open, existingEntry]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      mediaPreviews.forEach((m) => URL.revokeObjectURL(m.localUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckIn = async () => {
    if (isDone) return;
    const remoteUrls = mediaPreviews
      .filter((m) => m.remoteUrl && !m.error)
      .map((m) => m.remoteUrl!);
    try {
      await checkIn({
        challengeId,
        dayNumber: isBackfill ? targetDay : isEditing ? targetDay : undefined,
        notes: notes.trim() || undefined,
        mediaUrls: remoteUrls.length > 0 ? remoteUrls : undefined,
        sharedToFeed,
        value: value !== "" ? Number(value) : undefined,
      }).unwrap();
      play("success");
      toast.success(isEditing ? `Day ${targetDay} updated!` : `Day ${targetDay} checked in!`);
      setNotes("");
      setMediaPreviews([]);
      setSharedToFeed(false);
      setValue("");
      onClose();
    } catch (err) {
      play("error");
      toast.error(getErrorMessage(err, "Failed to check in"));
    }
  };

  const handleSkip = async () => {
    if (isDone) return;
    try {
      await checkIn({
        challengeId,
        skip: true,
      }).unwrap();
      play("success");
      toast.success(`Day ${currentDay} skipped`);
      onClose();
    } catch (err) {
      play("error");
      toast.error(getErrorMessage(err, "Failed to skip day"));
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-lg rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-lg)]"
            data-custom-modal
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                {isEditing
                  ? `Edit Day ${targetDay} / ${totalDays}`
                  : isBackfill
                    ? `Backfill Day ${targetDay} / ${totalDays}`
                    : `Day ${targetDay} / ${totalDays}`}
              </h2>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
              >
                <X className="size-4" />
              </button>
            </div>

            {isDone && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-brand-teal/10 p-3 text-sm font-semibold text-brand-teal">
                <Check className="size-4" /> You&apos;ve completed all days!
              </div>
            )}

            {isBackfill && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-brand-amber/10 p-3 text-sm font-semibold text-brand-amber">
                <ArrowLeft className="size-4" /> Backfilling a missed day — your current progress is
                day {currentDay}
              </div>
            )}

            {isEditing && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-brand-teal/10 p-3 text-sm font-semibold text-brand-teal">
                <Check className="size-4" /> Editing check-in for day {targetDay}
              </div>
            )}

            {/* Today's Task from day plan */}
            {dayPlan && (
              <div className="mb-4 rounded-xl border border-brand-teal/20 bg-gradient-to-br from-brand-teal/[0.05] to-brand-green/[0.03] p-3">
                <p className="text-[10px] font-semibold text-brand-teal uppercase tracking-wider">
                  {isBackfill ? "Missed Day Task" : isEditing ? "Day Task" : "Today's Task"}
                </p>
                <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">
                  {dayPlan.title || `Day ${dayPlan.dayNumber}`}
                </p>
                {dayPlan.description && (
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{dayPlan.description}</p>
                )}
                {dayPlan.tips && (
                  <p className="mt-1 text-xs text-brand-amber/80 italic">{dayPlan.tips}</p>
                )}
              </div>
            )}

            {!isDone && (
              <div className="space-y-4">
                {showValueInput && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                      Today&apos;s progress ({goalUnit})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={value}
                      onChange={(e) =>
                        setValue(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder={`e.g. 2.5 ${goalUnit}`}
                      className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                    />
                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                      Total goal: {goalTarget} {goalUnit}
                    </p>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="How did it go?"
                    rows={3}
                    maxLength={2000}
                    className="w-full resize-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    Photo
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {mediaPreviews.map((item) => (
                      <div key={item.id} className="relative size-16 overflow-hidden rounded-lg">
                        <Image
                          src={item.localUrl}
                          alt="Check-in photo"
                          className="size-full object-cover"
                          width={64}
                          height={64}
                        />
                        {item.uploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Upload className="size-5 animate-pulse text-white" />
                          </div>
                        )}
                        {item.error && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <span className="text-[9px] font-semibold text-red-400">Failed</span>
                          </div>
                        )}
                        {!item.uploading && (
                          <button
                            onClick={() => removeMedia(item.id)}
                            className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleImageUpload}
                      disabled={uploading}
                      className="flex size-16 items-center justify-center rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-overlay)] disabled:opacity-50"
                    >
                      {uploading ? (
                        <Upload className="size-5 animate-pulse" />
                      ) : (
                        <Camera className="size-5" />
                      )}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <label className="flex items-center gap-2 rounded-xl bg-[var(--bg-subtle)] p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sharedToFeed}
                    onChange={(e) => setSharedToFeed(e.target.checked)}
                    className="rounded border-[var(--border-default)] text-brand-teal focus:ring-brand-teal"
                  />
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      Share to Feed
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Post this check-in to your profile
                    </p>
                  </div>
                </label>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              {!isDone && (
                <>
                  {hasDayPlans && !isBackfill && !isEditing && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleSkip}
                      disabled={isSubmitting}
                      className="flex-1 gap-1.5"
                    >
                      <SkipForward className="size-3.5" /> Skip
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={isSubmitting}
                    onClick={handleCheckIn}
                    className="flex-1"
                  >
                    {isSubmitting ? "Saving..." : isEditing ? "Update" : isBackfill ? "Log Missed Day" : "Check In"}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
