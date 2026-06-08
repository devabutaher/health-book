"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/hooks";
import { useBrowseReelsQuery, useToggleReelLikeMutation } from "@/redux/api/reelsApi";
import { useReelRealtime } from "@/hooks/useReelRealtime";
import { useFollowActions } from "@/hooks/useFollow";
import type { Reel } from "@/types/reel";
import { AlertCircle, Loader2, Plus, RefreshCw, UserPlus, Video } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ReelActions } from "./ReelActions";
import { ReelComments } from "./ReelComments";
import { ReelPlayer } from "./ReelPlayer";
import { ReelSkeleton } from "./ReelSkeleton";
import { getImageUrl } from "@/lib/utils";

/** Only mount full ReelPlayer for active reindeer ± this window; others show thumbnail */
const MOUNT_WINDOW = 1;

export function ReelsFeed({ onUploadClick }: { onUploadClick?: () => void }) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allReels, setAllReels] = useState<Reel[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [commentsReelId, setCommentsReelId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef(new Set<string>());
  const currentUserId = useAppSelector((s) => s.auth.user?.id);

  const { data, isFetching, isError, error, refetch } = useBrowseReelsQuery({ cursor });
  const [toggleLike] = useToggleReelLikeMutation();
  const { follow, unfollow } = useFollowActions();

  useEffect(() => {
    if (data?.reels) {
      setAllReels((prev) => {
        const updated = [...prev];
        for (const reel of data.reels) {
          const idx = updated.findIndex((r) => r.id === reel.id);
          if (idx >= 0) {
            updated[idx] = reel;
          } else if (!seenIds.current.has(reel.id)) {
            seenIds.current.add(reel.id);
            updated.push(reel);
          }
        }
        return updated;
      });
    }
  }, [data]);

  const handleDeleteReel = (reelId: string) => {
    setAllReels((prev) => prev.filter((r) => r.id !== reelId));
    if (commentsReelId === reelId) setCommentsReelId(null);
  };

  const handleCaptionUpdate = (reelId: string, caption: string | null) => {
    setAllReels((prev) => prev.map((r) => (r.id === reelId ? { ...r, caption } : r)));
  };

  const handleLikeToggle = useCallback(
    async (reelId: string) => {
      if (!currentUserId) return;

      setAllReels((prev) =>
        prev.map((r) =>
          r.id === reelId
            ? {
                ...r,
                isLiked: !r.isLiked,
                likesCount: r.isLiked ? r.likesCount - 1 : r.likesCount + 1,
              }
            : r,
        ),
      );

      try {
        await toggleLike(reelId).unwrap();
      } catch {
        setAllReels((prev) =>
          prev.map((r) =>
            r.id === reelId
              ? {
                  ...r,
                  isLiked: !r.isLiked,
                  likesCount: r.isLiked ? r.likesCount - 1 : r.likesCount + 1,
                }
              : r,
          ),
        );
      }
    },
    [currentUserId, toggleLike],
  );

  const handleFollow = useCallback(
    async (userId: string) => {
      setAllReels((prev) =>
        prev.map((r) =>
          r.user.id === userId ? { ...r, user: { ...r.user, isFollowing: true } } : r,
        ),
      );
      try {
        await follow(userId);
      } catch {
        setAllReels((prev) =>
          prev.map((r) =>
            r.user.id === userId ? { ...r, user: { ...r.user, isFollowing: false } } : r,
          ),
        );
        toast.error("Failed to follow");
      }
    },
    [follow],
  );

  const handleUnfollow = useCallback(
    async (userId: string) => {
      setAllReels((prev) =>
        prev.map((r) =>
          r.user.id === userId ? { ...r, user: { ...r.user, isFollowing: false } } : r,
        ),
      );
      try {
        await unfollow(userId);
      } catch {
        setAllReels((prev) =>
          prev.map((r) =>
            r.user.id === userId ? { ...r, user: { ...r.user, isFollowing: true } } : r,
          ),
        );
        toast.error("Failed to unfollow");
      }
    },
    [unfollow],
  );

  const displayReels = allReels.length > 0 ? allReels : data?.reels || [];

  const activeReelId = displayReels[activeIdx]?.id ?? null;
  useReelRealtime(activeReelId);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setActiveIdx(idx);

    const total = displayReels.length;
    if (idx >= total - 2 && data?.hasMore && !isFetching && total > 0) {
      const lastId = allReels[allReels.length - 1]?.id;
      if (lastId) setCursor(lastId);
    }
  }, [displayReels.length, allReels, data, isFetching]);

  const shouldMountPlayer = useCallback(
    (index: number) => Math.abs(index - activeIdx) <= MOUNT_WINDOW,
    [activeIdx],
  );

  if (!data && allReels.length === 0) {
    return <ReelSkeleton />;
  }

  if (isError && allReels.length === 0) {
    const errorMsg =
      (error as { data?: { message?: string } })?.data?.message ||
      "Failed to load reels. Check that the backend server is running.";
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertCircle className="size-8 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Something went wrong</p>
          <p className="mt-1 text-xs text-muted-foreground">{errorMsg}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="size-3.5" />
          Try Again
        </Button>
      </div>
    );
  }

  if (allReels.length === 0 && !data?.reels?.length) {
    return (
      <Empty className="h-full justify-center">
        <EmptyMedia variant="gradient">
          <Video />
        </EmptyMedia>
        <EmptyTitle>No reels yet</EmptyTitle>
        <EmptyDescription>
          Be the first to share a reel! Upload a video to inspire others on their health journey.
        </EmptyDescription>
        <Button variant="gradient" onClick={onUploadClick} className="gap-1.5">
          <Plus className="size-4" />
          Upload your first reel
        </Button>
      </Empty>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full snap-y snap-mandatory overflow-y-auto scrollbar-none"
      >
        {displayReels.map((reel, index) => {
          const mountPlayer = shouldMountPlayer(index);

          return (
            <div key={reel.id} className="relative h-full snap-start snap-always my-0">
              <div className="relative mx-auto h-full w-full max-w-md">
                <div className="h-full flex items-center justify-center">
                  <div className="relative w-full aspect-[9/16] max-h-full rounded-2xl overflow-hidden bg-black/10">
                    {mountPlayer ? (
                      <ReelPlayer
                        videoUrl={reel.videoUrl}
                        isActive={index === activeIdx && commentsReelId !== reel.id}
                        onDoubleTapLike={() => handleLikeToggle(reel.id)}
                        thumbnailUrl={reel.thumbnailUrl}
                      />
                    ) : (
                      <div className="h-full w-full bg-[var(--bg-subtle)]">
                        {reel.thumbnailUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getImageUrl(reel.thumbnailUrl, "q_auto,f_auto,w_400") ?? undefined}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 pt-12">
                      <div className="flex items-center gap-2">
                        <Link href={`/${reel.user.username}`} prefetch={false}>
                          <Avatar className="size-8 ring-2 ring-white/30 cursor-pointer hover:opacity-80 transition-opacity">
                            {reel.user.avatar ? (
                              <AvatarImage src={reel.user.avatar} alt={reel.user.name} />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-xs text-white">
                              {reel.user.name?.charAt(0)?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <Link
                          href={`/${reel.user.username}`}
                          prefetch={false}
                          className="font-semibold text-white hover:underline"
                        >
                          {reel.user.name}
                        </Link>
                        {currentUserId && reel.user.id !== currentUserId && (
                          <button
                            onClick={() =>
                              reel.user.isFollowing
                                ? handleUnfollow(reel.user.id)
                                : handleFollow(reel.user.id)
                            }
                            className="ml-1 inline-flex min-h-[36px] items-center justify-center gap-0.5 rounded-full border px-2 text-[10px] font-semibold text-white transition-colors hover:bg-white/20"
                          >
                            {reel.user.isFollowing ? (
                              "Following"
                            ) : (
                              <>
                                <UserPlus className="size-3 shrink-0" /> Follow
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      {reel.caption && (
                        <p className="mt-1.5 line-clamp-2 text-white/80">{reel.caption}</p>
                      )}
                    </div>

                    <ReelActions
                      reelId={reel.id}
                      currentCaption={reel.caption}
                      initialLiked={reel.isLiked}
                      initialLikesCount={reel.likesCount}
                      commentsCount={reel.commentsCount}
                      isOwner={currentUserId === reel.user.id}
                      onLikeToggle={() => handleLikeToggle(reel.id)}
                      onCommentClick={() =>
                        setCommentsReelId(commentsReelId === reel.id ? null : reel.id)
                      }
                      onDelete={() => handleDeleteReel(reel.id)}
                      onCaptionUpdate={(c) => handleCaptionUpdate(reel.id, c)}
                    />

                    {commentsReelId === reel.id && (
                      <ReelComments
                        reelId={reel.id}
                        open={true}
                        onClose={() => setCommentsReelId(null)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!data?.hasMore && displayReels.length > 0 && !isFetching && (
          <div className="relative h-full snap-start snap-always my-0">
            <div className="relative mx-auto flex h-full w-full max-w-md flex-col items-center justify-center gap-4 rounded-2xl bg-background/80 backdrop-blur-sm p-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <Video className="size-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">You&apos;ve seen all reels</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload a new reel to inspire others
                </p>
              </div>
              <Button variant="gradient" size="sm" onClick={onUploadClick} className="gap-1.5">
                <Plus className="size-4" />
                Upload a Reel
              </Button>
            </div>
          </div>
        )}

        {isFetching && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </>
  );
}
