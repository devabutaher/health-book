"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Monitor,
  Pause,
  Play,
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  Settings as SettingsIcon,
  Sparkles,
  User,
  Globe,
  Lock,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { GlassCard } from "@/components/ui/glass-card";
import { Switch } from "@/components/ui/switch";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { setUser } from "@/redux/slices/authSlice";
import {
  setThemePreference,
  toggleSound,
  toggleAutoplay,
  toggleCompact,
  setReducedMotion,
  type ThemePreference,
} from "@/redux/slices/settingsSlice";
import { useUpdateProfileMutation } from "@/redux/api/userApi";
import { useTheme } from "@/hooks/useTheme";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { toast } from "sonner";

export default function SettingsPage() {

  const dispatch = useAppDispatch();
  const { setTheme } = useTheme();
  const currentUser = useAppSelector((s) => s.auth.user);
  const { soundEnabled, themePreference, reducedMotion, autoplayVideos, compactMode } =
    useAppSelector((s) => s.settings);

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const prevSettingsUser = useRef(currentUser?.id);
  useEffect(() => {
    if (currentUser?.id !== prevSettingsUser.current) {
      prevSettingsUser.current = currentUser?.id;
      setName(currentUser?.name || "");
      setBio(currentUser?.bio || "");
      setGender(currentUser?.gender || "");
      setIsPrivate(currentUser?.isPrivate || false);
    }
  }, [currentUser]);

  const handleThemeChange = (value: string) => {
    if (!value) return;
    const next = value as ThemePreference;
    dispatch(setThemePreference(next));
    setTheme(next);
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateProfile({ name: name.trim(), bio: bio.trim() || undefined, isPrivate, gender: gender || undefined }).unwrap();
      if (result.data) dispatch(setUser(result.data));
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-[700px]">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col gap-4 sm:gap-6"
        >
          <motion.div variants={staggerItem} className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-teal/15 to-brand-blue/15 text-brand-teal">
              <SettingsIcon className="size-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight">Settings</h1>
              <p className="text-sm text-muted-foreground">Tune your HealthBook experience</p>
            </div>
          </motion.div>

          {/* Account */}
          <motion.div variants={staggerItem}>
            <GlassCard variant="subtle" className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo to-brand-blue text-white">
                  <User className="size-4" />
                </div>
                <h2 className="font-display text-lg font-bold">Account</h2>
              </div>

              <FieldGroup className="gap-5">

                <Separator />

                <Field>
                  <FieldLabel className="text-sm font-medium">Display name</FieldLabel>
                  <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
                </Field>

                <Field>
                  <FieldLabel className="text-sm font-medium">Bio</FieldLabel>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full resize-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-sm font-medium">Gender</FieldLabel>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGender("male")}
                      className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                        gender === "male"
                          ? "border-brand-teal bg-brand-teal/10 text-brand-teal"
                          : "border-[var(--border-default)] text-muted-foreground hover:border-brand-teal/30"
                      }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender("female")}
                      className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                        gender === "female"
                          ? "border-brand-teal bg-brand-teal/10 text-brand-teal"
                          : "border-[var(--border-default)] text-muted-foreground hover:border-brand-teal/30"
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </Field>

                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={isUpdating || !name.trim() || !gender}
                >
                  {isUpdating ? "Saving..." : "Save changes"}
                </Button>

                <div className="rounded-xl bg-[var(--bg-subtle)] px-4 py-3">
                  <Link
                    href={`/${currentUser?.username || ""}`}
                    prefetch={false}
                    className="text-xs text-brand-teal hover:underline"
                  >
                    View and edit your public profile →
                  </Link>
                </div>
              </FieldGroup>
            </GlassCard>
          </motion.div>

          {/* Appearance */}
          <motion.div variants={staggerItem}>
            <GlassCard variant="subtle" className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-teal to-brand-green text-white">
                  <Sparkles className="size-4" />
                </div>
                <h2 className="font-display text-lg font-bold">Appearance</h2>
              </div>

              <FieldGroup className="gap-5">
                <Field>
                  <FieldLabel className="text-sm font-medium">Theme</FieldLabel>
                  <FieldDescription>Choose how HealthBook looks for you.</FieldDescription>
                  <ToggleGroup
                    type="single"
                    value={themePreference}
                    onValueChange={handleThemeChange}
                    className="mt-2 grid w-full grid-cols-3"
                  >
                    <ToggleGroupItem value="light" aria-label="Light theme" className="gap-1.5">
                      <Sun className="size-4" />
                      <span>Light</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="system" aria-label="System theme" className="gap-1.5">
                      <Monitor className="size-4" />
                      <span>System</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="dark" aria-label="Dark theme" className="gap-1.5">
                      <Moon className="size-4" />
                      <span>Dark</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </Field>

                <Separator />

                <Field>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <FieldLabel className="text-sm font-medium">Compact mode</FieldLabel>
                      <FieldDescription>
                        Denser layout with smaller cards and tighter spacing.
                      </FieldDescription>
                    </div>
                    <Switch
                      checked={compactMode}
                      onCheckedChange={() => dispatch(toggleCompact())}
                      aria-label="Toggle compact mode"
                    >
                      {compactMode ? (
                        <Minimize2 className="size-3" />
                      ) : (
                        <Maximize2 className="size-3" />
                      )}
                    </Switch>
                  </div>
                </Field>
              </FieldGroup>
            </GlassCard>
          </motion.div>

          {/* Sound & Motion */}
          <motion.div variants={staggerItem}>
            <GlassCard variant="subtle" className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-pink text-white">
                  {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                </div>
                <h2 className="font-display text-lg font-bold">Sound & Motion</h2>
              </div>

              <FieldGroup className="gap-5">
                <Field>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <FieldLabel className="text-sm font-medium">Sound effects</FieldLabel>
                      <FieldDescription>
                        Play sounds for posts, reactions, and milestones.
                      </FieldDescription>
                    </div>
                    <Switch
                      checked={soundEnabled}
                      onCheckedChange={() => dispatch(toggleSound())}
                      aria-label="Toggle sound effects"
                    >
                      {soundEnabled ? (
                        <Volume2 className="size-3" />
                      ) : (
                        <VolumeX className="size-3" />
                      )}
                    </Switch>
                  </div>
                </Field>

                <Separator />

                <Field>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <FieldLabel className="text-sm font-medium">Reduced motion</FieldLabel>
                      <FieldDescription>
                        Minimize animations and transitions throughout the app.
                      </FieldDescription>
                    </div>
                    <Switch
                      checked={reducedMotion}
                      onCheckedChange={(v) => dispatch(setReducedMotion(Boolean(v)))}
                      aria-label="Toggle reduced motion"
                    >
                      {reducedMotion ? <Pause className="size-3" /> : <Play className="size-3" />}
                    </Switch>
                  </div>
                </Field>
              </FieldGroup>
            </GlassCard>
          </motion.div>

          {/* Media */}
          <motion.div variants={staggerItem}>
            <GlassCard variant="subtle" className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-coral to-brand-amber text-white">
                  {autoplayVideos ? <Video className="size-4" /> : <VideoOff className="size-4" />}
                </div>
                <h2 className="font-display text-lg font-bold">Media</h2>
              </div>

              <FieldGroup className="gap-5">
                <Field>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <FieldLabel className="text-sm font-medium">Autoplay videos</FieldLabel>
                      <FieldDescription>
                        Automatically play videos in the feed when visible.
                      </FieldDescription>
                    </div>
                    <Switch
                      checked={autoplayVideos}
                      onCheckedChange={() => dispatch(toggleAutoplay())}
                      aria-label="Toggle autoplay videos"
                    >
                      {autoplayVideos ? (
                        <Video className="size-3" />
                      ) : (
                        <VideoOff className="size-3" />
                      )}
                    </Switch>
                  </div>
                </Field>
              </FieldGroup>
            </GlassCard>
          </motion.div>

          {/* Privacy */}
          <motion.div variants={staggerItem}>
            <GlassCard variant="subtle" className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-indigo text-white">
                  {isPrivate ? <Lock className="size-4" /> : <Globe className="size-4" />}
                </div>
                <h2 className="font-display text-lg font-bold">Privacy</h2>
              </div>

              <FieldGroup className="gap-5">
                <Field>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <FieldLabel className="text-sm font-medium">Private account</FieldLabel>
                      <FieldDescription>
                        {isPrivate
                          ? "Only approved followers can see your posts and profile."
                          : "Anyone can see your posts and profile."}
                      </FieldDescription>
                    </div>
                    <Switch
                      checked={isPrivate}
                      onCheckedChange={async (v) => {
                        setIsPrivate(v);
                        try {
                          await updateProfile({ isPrivate: v }).unwrap();
                          toast.success(v ? "Account set to private" : "Account set to public");
                        } catch {
                          setIsPrivate(!v);
                          toast.error("Failed to update privacy");
                        }
                      }}
                      aria-label="Toggle private account"
                    >
                      {isPrivate ? <Lock className="size-3" /> : <Globe className="size-3" />}
                    </Switch>
                  </div>
                </Field>
              </FieldGroup>
            </GlassCard>
          </motion.div>

          {/* Danger Zone */}
          <motion.div variants={staggerItem}>
            <GlassCard variant="subtle" className="border-red-500/20 p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-brand-coral text-white">
                  <AlertTriangle className="size-4" />
                </div>
                <h2 className="font-display text-lg font-bold text-red-500">Danger Zone</h2>
              </div>

              <FieldGroup className="gap-4">
                <p className="text-xs text-muted-foreground">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                  className="gap-1.5"
                >
                  <Trash2 className="size-4" />
                  Delete Account
                </Button>
              </FieldGroup>
            </GlassCard>
          </motion.div>

          <motion.div variants={staggerItem} className="text-center text-xs text-muted-foreground">
            Settings are saved automatically.
          </motion.div>
        </motion.div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}
