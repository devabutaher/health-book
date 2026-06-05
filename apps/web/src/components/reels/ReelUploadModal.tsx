"use client";

import { Button } from "@/components/ui/button";
import { scaleIn } from "@/lib/motion/variants";
import { useUploadReelMutation } from "@/redux/api/reelsApi";
import { AnimatePresence, motion } from "framer-motion";
import { Video, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
export function ReelUploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadReel, { isLoading }] = useUploadReelMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video must be under 50MB");
      return;
    }
    setVideoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!videoFile) return;
    const toastId = toast.loading("Uploading reel...");
    const formData = new FormData();
    formData.append("video", videoFile);
    if (caption.trim()) formData.append("caption", caption.trim());
    try {
      await uploadReel(formData).unwrap();
      toast.dismiss(toastId);
      toast.success("Reel uploaded!");
      setVideoFile(null);
      setCaption("");
      setPreview("");
      onClose();
    } catch {
      toast.dismiss(toastId);
      toast.error("Failed to upload reel");
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
            className="relative w-full max-w-xl rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-lg)]"
            data-custom-modal
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                Upload Reel
              </h2>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
              >
                <X className="size-4" />
              </button>
            </div>

            {!videoFile ? (
              <button
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border-default)] py-12 transition-colors hover:border-brand-teal/50 hover:bg-[var(--bg-subtle)]"
              >
                <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-teal/20 to-brand-green/20">
                  <Video className="size-8 text-brand-teal" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Select a video</p>
                  <p className="text-xs text-[var(--text-muted)]">MP4, WebM, or MOV</p>
                </div>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="relative mx-auto aspect-[9/16] max-h-64 overflow-hidden rounded-xl bg-black">
                  <video src={preview} className="h-full w-full object-contain" controls />
                </div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  maxLength={2000}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setVideoFile(null);
                      setPreview("");
                    }}
                    className="flex-1"
                  >
                    Change
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={handleUpload}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={handleFileSelect}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
