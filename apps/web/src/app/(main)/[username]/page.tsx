"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { FollowersModal } from "@/components/profile/FollowersModal";
import { useGetProfileQuery } from "@/redux/api/userApi";
import { useGetUserPostsQuery, useGetSavedQuery } from "@/redux/api/postApi";
import { DraftsList } from "@/components/profile/DraftsList";
import { PostCard } from "@/components/post/PostCard";
import { PostSkeleton } from "@/components/shared/PostSkeleton";
import type { Post } from "@/types/post";
import { useGetHealthLogsQuery } from "@/redux/api/healthLogApi";
import { useGetHighlightsQuery } from "@/redux/api/highlightsApi";
import { HighlightCircle } from "@/components/stories/HighlightCircle";
import { HighlightViewer } from "@/components/stories/HighlightViewer";
import { HighlightManager } from "@/components/stories/HighlightManager";
import { ChallengeStatsCard } from "@/components/challenges/ChallengeStatsCard";
import { DuelCreationModal } from "@/components/challenges/DuelCreationModal";
import { useAppSelector } from "@/hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HealthLogCard from "@/components/health/HealthLogCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  Bookmark,
  FileText,
  Heart,
  Image as ImageIcon,
  Swords,
} from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import type { HealthLog } from "@/redux/api/healthLogApi";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const currentUser = useAppSelector((s) => s.auth.user);
  const { data, isLoading, error } = useGetProfileQuery(username);
  const [editOpen, setEditOpen] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followersTab, setFollowersTab] = useState<"followers" | "following">("followers");
  const profile = data?.data;
  const isOwner = currentUser?.username === username;

  const [highlightsOpen, setHighlightsOpen] = useState(false);
  const [manageHighlightsOpen, setManageHighlightsOpen] = useState(false);
  const [highlightsIdx, setHighlightsIdx] = useState(0);
  const [duelOpen, setDuelOpen] = useState(false);
  const { data: highlights } = useGetHighlightsQuery(undefined, { skip: !isOwner });
  const activeHighlights = highlights?.filter((hl) => hl.items.length > 0) || [];

  const { data: postsData, isLoading: postsLoading } = useGetUserPostsQuery(
    { userId: profile?.id || "" },
    { skip: !profile?.id },
  );
  const posts = postsData?.data?.posts || [];

  const { data: logsData, isLoading: logsLoading } = useGetHealthLogsQuery(
    { limit: 20 },
    { skip: !profile?.id },
  );
  const logs = (logsData?.logs || []) as HealthLog[];

  if (isLoading) {
    return (
        <div className="mx-auto max-w-3xl">
          <Skeleton className="h-56 rounded-2xl" />
          <div className="mt-6 space-y-2 px-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
    );
  }

  if (error || !profile) {
    return (
        <div className="mx-auto max-w-3xl">
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>User not found</AlertTitle>
            <AlertDescription>
              The user @{username} doesn&apos;t exist or has been removed.
            </AlertDescription>
          </Alert>
        </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-3xl">
        <ProfileHeader
          profile={profile}
          onEdit={isOwner ? () => setEditOpen(true) : undefined}
          onFollowersClick={() => {
            setFollowersTab("followers");
            setFollowersOpen(true);
          }}
          onFollowingClick={() => {
            setFollowersTab("following");
            setFollowersOpen(true);
          }}
        />

        {/* Story Highlights */}
        {isOwner && activeHighlights.length > 0 && (
          <div className="mt-4 sm:mt-6 flex items-center gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none">
            {activeHighlights.map((hl, idx) => (
              <HighlightCircle
                key={hl.id}
                highlight={hl}
                onClick={() => {
                  setHighlightsIdx(idx);
                  setHighlightsOpen(true);
                }}
              />
            ))}
            <button
              onClick={() => setManageHighlightsOpen(true)}
              className="flex flex-col items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-[var(--border-default)]">
                <span className="text-lg font-bold text-muted-foreground">+</span>
              </div>
              <span>Manage</span>
            </button>
          </div>
        )}

        {/* Challenge Stats */}
        <div className="mt-4 sm:mt-6">
          <ChallengeStatsCard userId={profile.id} />
        </div>

        {!isOwner && (
          <div className="mt-4">
            <button
              onClick={() => setDuelOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-coral/20 bg-gradient-to-r from-brand-coral/10 to-brand-pink/10 px-4 py-3 text-sm font-bold text-brand-coral transition-all hover:from-brand-coral/20 hover:to-brand-pink/20"
            >
              <Swords className="size-4" />
              Challenge to Duel
            </button>
          </div>
        )}

        <DuelCreationModal
          open={duelOpen}
          onClose={() => setDuelOpen(false)}
          targetUserId={profile.id}
          targetName={profile.name}
        />

        <Tabs defaultValue="posts" className="mt-4 sm:mt-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="posts" className="gap-1.5">
              <FileText className="size-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-1.5">
              <Heart className="size-4" />
              Health Logs
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger value="saved" className="gap-1.5">
                <Bookmark className="size-4" />
                Saved
              </TabsTrigger>
            )}
            {isOwner && (
              <TabsTrigger value="drafts" className="gap-1.5">
                <FileText className="size-4" />
                Drafts
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {postsLoading ? (
              <div className="flex flex-col gap-4">
                <PostSkeleton />
                <PostSkeleton />
              </div>
            ) : posts.length > 0 ? (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="flex flex-col gap-4"
              >
                {posts.map((post: Post) => (
                  <motion.div key={post.id} variants={staggerItem}>
                    <PostCard post={post} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <Empty>
                <EmptyMedia variant="gradient">
                  <ImageIcon />
                </EmptyMedia>
                <EmptyTitle>No posts yet</EmptyTitle>
                <EmptyDescription>
                  {isOwner
                    ? "Share your first post from the feed."
                    : `@${profile.username} hasn't posted yet.`}
                </EmptyDescription>
              </Empty>
            )}
          </TabsContent>

          <TabsContent value="health" className="mt-6">
            {logsLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
            ) : logs.length > 0 ? (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="flex flex-col gap-3"
              >
                {logs.map((log) => (
                  <motion.div key={log.id} variants={staggerItem}>
                    <HealthLogCard log={log} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <Empty>
                <EmptyMedia variant="gradient">
                  <Heart />
                </EmptyMedia>
                <EmptyTitle>No health logs yet</EmptyTitle>
                <EmptyDescription>
                  Health logs from {isOwner ? "your" : `@${profile.username}'s`} My Book will appear
                  here.
                </EmptyDescription>
              </Empty>
            )}
          </TabsContent>

          {isOwner && (
            <TabsContent value="saved" className="mt-6">
              <SavedTab />
            </TabsContent>
          )}
          {isOwner && (
            <TabsContent value="drafts" className="mt-6">
              <DraftsList />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {isOwner && <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />}
      {profile && (
        <FollowersModal
          userId={profile.id}
          defaultTab={followersTab}
          open={followersOpen}
          onClose={() => setFollowersOpen(false)}
        />
      )}
      {highlightsOpen && activeHighlights.length > 0 && (
        <HighlightViewer
          highlights={activeHighlights}
          initialIndex={highlightsIdx}
          onClose={() => setHighlightsOpen(false)}
        />
      )}
      {manageHighlightsOpen && <HighlightManager onClose={() => setManageHighlightsOpen(false)} />}
    </>
  );
}

function SavedTab() {
  const { data, isLoading } = useGetSavedQuery({});
  const posts = (data?.data?.posts || data?.posts || []) as Post[];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Empty>
        <EmptyMedia variant="gradient">
          <Bookmark />
        </EmptyMedia>
        <EmptyTitle>No saved posts</EmptyTitle>
        <EmptyDescription>Bookmark posts to view them here later.</EmptyDescription>
      </Empty>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex flex-col gap-4"
    >
      {posts.map((post) => (
        <motion.div key={post.id} variants={staggerItem}>
          <PostCard post={post} />
        </motion.div>
      ))}
    </motion.div>
  );
}
