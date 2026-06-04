"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, ImagePlus, Camera } from "lucide-react";
import { useCreateGroupMutation, useUploadGroupMediaMutation } from "@/redux/api/groupsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { scaleIn } from "@/lib/motion/variants";
import { toast } from "sonner";

export function CreateGroupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"PUBLIC" | "PRIVATE" | "SECRET">("PUBLIC");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [createGroup, { isLoading }] = useCreateGroupMutation();
  const [uploadMedia, { isLoading: uploading }] = useUploadGroupMediaMutation();

  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, target: "avatar" | "cover") => {
    const fd = new FormData();
    fd.append("image", file);
    try {
      const { url } = await uploadMedia(fd).unwrap();
      if (target === "avatar") setAvatarUrl(url);
      else setCoverUrl(url);
    } catch {
      toast.error("Failed to upload image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const result = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        avatar: avatarUrl || undefined,
        coverPhoto: coverUrl || undefined,
      }).unwrap();
      toast.success("Group created!");
      onClose();
      setName("");
      setDescription("");
      setType("PUBLIC");
      setAvatarUrl("");
      setCoverUrl("");
      router.push(`/groups/${result.id}`);
    } catch {
      toast.error("Failed to create group");
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
                Create Group
              </h2>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="relative size-20 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-[var(--border-default)]"
                    onClick={() => avatarRef.current?.click()}
                  >
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-[var(--text-muted)]">
                        <Camera className="size-6" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">Avatar</span>
                  <input
                    ref={avatarRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "avatar");
                    }}
                  />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="relative h-14 w-28 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-[var(--border-default)]"
                    onClick={() => coverRef.current?.click()}
                  >
                    {coverUrl ? (
                      <Image src={coverUrl} alt="Cover" fill className="object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-[var(--text-muted)]">
                        <ImagePlus className="size-5" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">Cover</span>
                  <input
                    ref={coverRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "cover");
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  Group Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Morning Runners Club"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this group about?"
                  rows={3}
                  maxLength={2000}
                  className="w-full resize-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  Privacy
                </label>
                <div className="flex gap-2">
                  {(["PUBLIC", "PRIVATE", "SECRET"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                        type === t
                          ? "bg-gradient-to-r from-brand-teal to-brand-green text-white"
                          : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]"
                      }`}
                    >
                      {t === "PUBLIC" ? "Public" : t === "PRIVATE" ? "Private" : "Secret"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={!name.trim() || isLoading || uploading}
                  className="flex-1"
                >
                  {isLoading || uploading ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
