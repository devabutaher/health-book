"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { X, Check, Camera, Upload } from "lucide-react";
import { useCheckInMutation } from "@/redux/api/challengesApi";
import { motion, AnimatePresence } from "framer-motion";
import { scaleIn } from "@/lib/motion/variants";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
export function CheckInModal({
  challengeId,
  dayNumber,
  totalDays,
  open,
  onClose,
  existingEntry,
  goalTarget,
  goalUnit,
}: {
  challengeId: string;
  dayNumber: number;
  totalDays: number;
  open: boolean;
  onClose: () => void;
  existingEntry?: { completed: boolean; value?: number | null } | null;
  goalTarget?: number | null;
  goalUnit?: string | null;
}) {
  const [completed, setCompleted] = useState(true);
  const [notes, setNotes] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [sharedToFeed, setSharedToFeed] = useState(false);
  const [value, setValue] = useState<number | "">("");
  const [checkIn, { isLoading }] = useCheckInMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const alreadyCheckedIn = existingEntry?.completed === true;
  const showValueInput = goalTarget != null && goalUnit != null;

  const handleImageUpload = () => {
    const cloudinary = (window as unknown as { cloudinary?: { openUploadWidget: (...args: unknown[]) => { open: () => void } } }).cloudinary;
    if (cloudinary?.openUploadWidget) {
      const widget = cloudinary.openUploadWidget(
        {
          cloudName: process.env["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"],
          uploadPreset: "healthbook",
          multiple: false,
          sources: ["local", "camera"],
        },
        (_error: unknown, result: { event: string; info: { secure_url: string } }) => {
          if (result.event === "success") {
            setMediaUrls((prev) => [...prev, result.info.secure_url]);
          }
        },
      );
      widget?.open();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "healthbook");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"]}/image/upload`,
        { method: "POST", body: formData },
      );
      const data = await res.json();
      if (data.secure_url) {
        setMediaUrls((prev) => [...prev, data.secure_url]);
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (alreadyCheckedIn) return;
    try {
      await checkIn({
        challengeId,
        dayNumber,
        completed,
        notes: notes.trim() || undefined,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        sharedToFeed: sharedToFeed && completed,
        value: value !== "" ? Number(value) : undefined,
      }).unwrap();
      toast.success(completed ? `Day ${dayNumber} checked in!` : "Progress updated");
      setNotes("");
      setMediaUrls([]);
      setSharedToFeed(false);
      setValue("");
      onClose();
    } catch {
      toast.error("Failed to check in");
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
                Day {dayNumber} / {totalDays}
              </h2>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              {alreadyCheckedIn && (
                <div className="flex items-center gap-2 rounded-xl bg-brand-teal/10 p-3 text-sm font-semibold text-brand-teal">
                  <Check className="size-4" /> Already checked in for this day
                </div>
              )}

              <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-subtle)] p-3">
                <button
                  onClick={() => setCompleted(!completed)}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg transition-all",
                    completed
                      ? "bg-gradient-to-r from-brand-teal to-brand-green text-white shadow-[var(--shadow-glow-teal)]"
                      : "bg-[var(--bg-overlay)] text-[var(--text-muted)]",
                  )}
                >
                  <Check className="size-5" />
                </button>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {completed ? "Completed" : "Skipped"}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">Toggle to mark this day</p>
                </div>
              </div>

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
                    onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))}
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
                  placeholder="How did it go today?"
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
                  {mediaUrls.map((url, i) => (
                    <div key={i} className="relative size-16 overflow-hidden rounded-lg">
                      <Image
                        src={url}
                        alt="Check-in photo"
                        className="size-full object-cover"
                        width={64}
                        height={64}
                      />
                      <button
                        onClick={() => setMediaUrls((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-black/50 text-white"
                      >
                        <X className="size-3" />
                      </button>
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

              {completed && (
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
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={isLoading || alreadyCheckedIn}
                onClick={handleSubmit}
                className="flex-1"
              >
                {alreadyCheckedIn
                  ? "Already Done"
                  : isLoading
                    ? "Saving..."
                    : completed
                      ? "Check In"
                      : "Save"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
