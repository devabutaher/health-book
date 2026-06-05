"use client";

import Image from "next/image";
import { CalendarPlus, Flame, Heart, MessageCircle, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/hooks";
import { useFollowMutation, useUnfollowMutation } from "@/redux/api/userApi";
import { useCreateConversationMutation } from "@/redux/api/messagingApi";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatCompact } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";

interface ProfileData {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  avatar: string | null;
  coverPhoto: string | null;
  isVerified: boolean;
  isFollowing: boolean;
  streak?: number;
  healthScore?: number;
  _count: { posts: number; followers: number; following: number };
  createdAt: string;
}

export function ProfileHeader({
  profile,
  onEdit,
  onFollowersClick,
  onFollowingClick,
}: {
  profile: ProfileData;
  onEdit?: () => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}) {
  const router = useRouter();
  const currentUser = useAppSelector((s) => s.auth.user);
  const isOwner = currentUser?.id === profile.id;
  const [follow, { isLoading: following }] = useFollowMutation();
  const [unfollow, { isLoading: unfollowing }] = useUnfollowMutation();
  const [createConversation] = useCreateConversationMutation();
  const [isFollow, setIsFollow] = useState(profile.isFollowing);
  const { play } = useSound();

  const handleMessage = async () => {
    try {
      const result = await createConversation({ participantIds: [profile.id] }).unwrap();
      router.push(`/messages/${result.id}`);
    } catch {
      toast.error("Failed to start conversation");
    }
  };

  const handleFollow = async () => {
    if (isFollow) {
      try {
        await unfollow(profile.id).unwrap();
        setIsFollow(false);
      } catch {
        play("error");
        toast.error("Failed to update follow status");
      }
    } else {
      play("follow");
      try {
        await follow(profile.id).unwrap();
        setIsFollow(true);
        toast.success(`Following ${profile.name}`);
      } catch {
        play("error");
        toast.error("Failed to update follow status");
      }
    }
  };

  return (
    <GlassCard variant="elevated">
      <div className="relative h-48 sm:h-56">
        {profile.coverPhoto ? (
          <Image src={profile.coverPhoto} alt="Cover" fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 800px" />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-brand-teal via-brand-green to-brand-lime"
            aria-hidden
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      <div className="relative px-4 sm:px-6">
        <div className="flex items-end justify-between -mt-14 sm:-mt-16">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="shrink-0"
          >
            <div
              className={cn(
                "size-28 sm:size-32 rounded-full overflow-hidden",
                profile.isVerified
                  ? "p-[2px] bg-gradient-to-br from-brand-teal to-brand-green"
                  : "ring-4 ring-[var(--bg-elevated)]",
              )}
            >
              <div className="size-full rounded-full overflow-hidden">
                {profile.avatar ? (
                  <div className="relative size-full">
                    <Image
                      src={profile.avatar}
                      alt={profile.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                ) : (
                  <div className="size-full bg-gradient-to-br from-brand-teal to-brand-green" />
                )}
              </div>
            </div>
          </motion.div>

          <div className="pb-3">
            {isOwner ? (
              <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
                <Pencil />
                Edit profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant={isFollow ? "outline" : "gradient"}
                  size="sm"
                  onClick={handleFollow}
                  disabled={following || unfollowing}
                >
                  {isFollow ? "Following" : "Follow"}
                </Button>
                <button
                  onClick={handleMessage}
                  aria-label="Send message"
                  className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-r from-brand-teal to-brand-green text-white shadow-[var(--shadow-glow-teal)] transition-all hover:scale-105 active:scale-95"
                >
                  <MessageCircle className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 pb-5">
          <div className="flex items-center gap-1.5">
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{profile.name}</h1>
            {profile.isVerified && (
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-brand-blue text-white">
                <span className="text-[10px]">✓</span>
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>

          {profile.bio && (
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-foreground/90">
              {profile.bio}
            </p>
          )}

          {(profile.streak ?? 0) > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-amber/30 bg-gradient-to-r from-brand-amber/10 to-brand-coral/10 px-3 py-1 text-sm">
                <Flame className="size-4 text-brand-amber" />
                <strong className="font-display text-base text-brand-amber">
                  {profile.streak}
                </strong>
                <span className="text-muted-foreground">day streak</span>
              </div>
              {profile.healthScore !== undefined && profile.healthScore > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-green/30 bg-gradient-to-r from-brand-teal/10 to-brand-green/10 px-3 py-1 text-sm">
                  <Heart className="size-4 text-brand-green" />
                  <strong className="font-display text-base text-brand-green">
                    {profile.healthScore}
                  </strong>
                  <span className="text-muted-foreground">health score</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-5 text-sm">
            <div>
              <strong className="text-foreground">{formatCompact(profile._count.posts)}</strong>{" "}
              <span className="text-muted-foreground">posts</span>
            </div>
            <button onClick={onFollowersClick} className="transition-colors hover:text-foreground">
              <strong className="text-foreground">{formatCompact(profile._count.followers)}</strong>{" "}
              <span className="text-muted-foreground">followers</span>
            </button>
            <button onClick={onFollowingClick} className="transition-colors hover:text-foreground">
              <strong className="text-foreground">{formatCompact(profile._count.following)}</strong>{" "}
              <span className="text-muted-foreground">following</span>
            </button>
          </div>

          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarPlus className="size-3" />
            Joined{" "}
            {new Date(profile.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
