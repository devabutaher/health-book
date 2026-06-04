"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import {
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useUploadCoverMutation,
} from "@/redux/api/userApi";
import { useAppSelector, useAppDispatch } from "@/hooks";
import { setUser } from "@/redux/slices/authSlice";
import { toast } from "sonner";

export function EditProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const [update, { isLoading }] = useUpdateProfileMutation();
  const [uploadAvatar] = useUploadAvatarMutation();
  const [uploadCover] = useUploadCoverMutation();

  const formRef = useRef<HTMLFormElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current || !user) return;
    const fd = new FormData(formRef.current);
    const name = String(fd.get("name") || "").trim();
    const bio = String(fd.get("bio") || "").trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    let newAvatar = user.avatar;
    let newCover = user.coverPhoto;

    try {
      if (avatarFile) {
        const fdAvatar = new FormData();
        fdAvatar.append("avatar", avatarFile);
        const result = await uploadAvatar(fdAvatar).unwrap();
        newAvatar = result.data?.avatar ?? newAvatar;
      }
      if (coverFile) {
        const fdCover = new FormData();
        fdCover.append("cover", coverFile);
        const result = await uploadCover(fdCover).unwrap();
        newCover = result.data?.coverPhoto ?? newCover;
      }
      await update({ name, bio: bio || undefined }).unwrap();

      dispatch(setUser({ ...user, name, bio: bio || null, avatar: newAvatar, coverPhoto: newCover }));

      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);

      toast.success("Profile updated");
      onClose();
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const isBusy = saving || isLoading;
  const displayAvatar = avatarPreview ?? user?.avatar ?? null;
  const displayCover = coverPreview ?? user?.coverPhoto ?? null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Edit profile</DialogTitle>
          <DialogDescription>Update your public profile information.</DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="relative h-48 sm:h-56 rounded-2xl overflow-hidden bg-[var(--bg-subtle)]">
            <button
              type="button"
              onClick={() => coverRef.current?.click()}
              className="group relative size-full cursor-pointer"
              disabled={saving}
            >
              {displayCover ? (
                <Image
                  src={displayCover}
                  alt="Cover"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 560px"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-brand-teal via-brand-green to-brand-lime" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {saving && coverFile ? <Spinner /> : "Change cover"}
              </div>
            </button>

            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              className="group absolute -bottom-8 left-6 size-24 overflow-hidden rounded-full ring-4 ring-[var(--bg-elevated)] transition-all hover:ring-brand-teal/50 cursor-pointer"
              disabled={saving}
            >
              {displayAvatar ? (
                <div className="relative size-full">
                  <Image
                    src={displayAvatar}
                    alt="Profile"
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              ) : (
                <div className="size-full bg-gradient-to-br from-brand-teal to-brand-green" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                {saving && avatarFile ? <Spinner /> : <ImagePlus className="size-5" />}
              </div>
            </button>
          </div>

          <div className="pt-6">
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="name" className="text-sm font-medium">
                  Name
                </FieldLabel>
                <Input
                  id="name"
                  name="name"
                  defaultValue={user?.name ?? ""}
                  required
                  maxLength={50}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="bio" className="text-sm font-medium">
                  Bio
                </FieldLabel>
                <Textarea
                  id="bio"
                  name="bio"
                  defaultValue={user?.bio ?? ""}
                  rows={3}
                  maxLength={500}
                  placeholder="Tell us about your health journey..."
                />
              </Field>
            </FieldGroup>
          </div>

          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            className="hidden"
          />
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            onChange={handleCoverSelect}
            className="hidden"
          />

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isBusy}>
              <X />
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isBusy}>
              {isBusy ? <Spinner /> : <Save />}
              {isBusy ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
