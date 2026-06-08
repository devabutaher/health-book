"use client";

import { memo, useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn, getImageUrl, formatRelativeTime } from "@/lib/utils";
import { ReactionBar } from "./ReactionBar";
import { PostOptionsMenu } from "./PostOptionsMenu";
import { UserAvatar } from "../shared/UserAvatar";
import { Button } from "../ui/button";
import { GlassCard } from "../ui/glass-card";
import { useAppSelector, useAppDispatch } from "@/hooks";
import { useCopyHealthLogMutation } from "@/redux/api/healthLogApi";
import { useToggleSaveMutation, useToggleReactionMutation } from "@/redux/api/postApi";
import { userApi } from "@/redux/api/userApi";
import { useFollow } from "@/hooks/useFollow";
import type { Post, ReactionType } from "@/types/post";
import { toast } from "sonner";
import { staggerItem } from "@/lib/motion/variants";
import { useSound } from "@/hooks/useSound";

const CommentSection = dynamic(() =>
  import("./CommentSection").then((m) => ({ default: m.CommentSection })),
);
const CreatePostModal = dynamic(() =>
  import("./CreatePostModal").then((m) => ({ default: m.CreatePostModal })),
);
const ImageLightbox = dynamic(() =>
  import("../shared/ImageLightbox").then((m) => ({ default: m.ImageLightbox })),
);
const HealthLogEmbed = dynamic(() => import("../health/HealthLogEmbed"));
const RecipeEmbed = dynamic(() => import("../health/RecipeEmbed"));
const BeforeAfterSlider = dynamic(() => import("../shared/BeforeAfterSlider"));
const PostPollCard = dynamic(() =>
  import("./PostPollCard").then((m) => ({ default: m.PostPollCard })),
);
const PostQuizCard = dynamic(() =>
  import("./PostQuizCard").then((m) => ({ default: m.PostQuizCard })),
);

export const PostCard = memo(function PostCard({ post }: { post: Post }) {
  const user = useAppSelector((s) => s.auth.user);
  const isOwner = user?.id === post.userId;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const handleEdit = useCallback(() => setEditPostId(post.id), [post.id]);
  const [copyLog, { isLoading: copying }] = useCopyHealthLogMutation();
  const [toggleSave] = useToggleSaveMutation();
  const [toggleReaction] = useToggleReactionMutation();
  const [copied, setCopied] = useState(false);
  const dispatch = useAppDispatch();
  const { play } = useSound();
  const prefetchProfile = useCallback(() => {
    dispatch(userApi.util.prefetch("getProfile", post.user.username, {}));
  }, [dispatch, post.user.username]);

  const localReaction = post.reactions?.find((r) => r.userId === user?.id)?.type;
  const localReactionCount = post._count?.reactions ?? post.reactions?.length ?? 0;
  const isSaved = post.isSaved ?? false;

  const { isFollowing, toggleFollow } = useFollow(post.userId, post.user.isFollowing ?? false, {
    errorLabel: "update follow status",
  });

  const handleReaction = useCallback(
    async (type: ReactionType) => {
      try {
        await toggleReaction({ postId: post.id, type }).unwrap();
      } catch {
        play("error");
      }
    },
    [post.id, toggleReaction, play],
  );

  const showBeforeAfter = post.templateType === "BEFORE_AFTER";
  const showRecipe = post.templateType === "RECIPE";

  const handleCopy = useCallback(async () => {
    if (!post.healthLog) return;
    play("success");
    try {
      await copyLog(post.healthLog.id).unwrap();
      setCopied(true);
      toast.success("Saved to your My Book");
    } catch {
      play("error");
      toast.error("Failed to save health log");
    }
  }, [post.healthLog, copyLog, play]);

  const handleSave = useCallback(async () => {
    play("success");
    try {
      await toggleSave(post.id).unwrap();
      toast.success(isSaved ? "Removed from saved" : "Post saved");
    } catch {
      play("error");
      toast.error("Failed to save post");
    }
  }, [post.id, isSaved, toggleSave, play]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator
        .share({
          title: `${post.user.name} on HealthBook`,
          url: `${window.location.origin}/post/${post.id}`,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      play("success");
      toast.success("Link copied");
    }
  }, [post.user.name, post.id, play]);

  return (
    <motion.div variants={staggerItem}>
      <GlassCard variant="elevated" className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <Link
            href={`/${post.user.username}`}
            prefetch={false}
            onMouseEnter={prefetchProfile}
            className="flex items-center gap-3"
          >
            <UserAvatar
              name={post.user.name}
              avatar={post.user.avatar}
              ring={post.user.isVerified ? "premium" : "default"}
              size="default"
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold hover:underline">{post.user.name}</span>
                {post.user.isVerified && (
                  <span className="inline-flex size-3.5 items-center justify-center rounded-full bg-brand-blue text-white">
                    <span className="text-[8px]">✓</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                @{post.user.username} · {formatRelativeTime(new Date(post.createdAt))}
              </p>
            </div>
          </Link>
          {!isOwner && (
            <button
              onClick={toggleFollow}
              className={cn(
                "ml-auto mr-2 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-[colors,opacity]",
                isFollowing
                  ? "border border-[var(--border-default)] text-muted-foreground hover:border-destructive hover:text-destructive"
                  : "bg-gradient-to-r from-brand-teal to-brand-green text-white",
              )}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
          <PostOptionsMenu postId={post.id} isOwner={isOwner} onEdit={handleEdit} />
        </div>

        {post.content && (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {post.content}
          </p>
        )}

        {post.healthLog && !showBeforeAfter && (
          <div className="mt-3">
            <HealthLogEmbed healthLog={post.healthLog} />
          </div>
        )}

        {showRecipe && post.templateData && (
          <div className="mt-3">
            <RecipeEmbed data={post.templateData} />
          </div>
        )}

        {post.mediaUrls?.length > 0 && (
          <div className="mt-3">
            {showBeforeAfter ? (
              <BeforeAfterSlider before={post.mediaUrls[0]} after={post.mediaUrls[1]} />
            ) : (
              <div
                className={cn(
                  "grid gap-1 overflow-hidden rounded-2xl",
                  post.mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2",
                )}
              >
                {post.mediaUrls.slice(0, 4).map((url: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className="group relative aspect-square overflow-hidden bg-[var(--bg-subtle)]"
                  >
                    <Image
                      src={getImageUrl(url, "q_auto:best,f_auto") ?? url}
                      alt=""
                      placeholder="blur"
                      blurDataURL={
                        getImageUrl(url, "w_20,e_blur:2000,q_auto:low,f_auto") ?? undefined
                      }
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 300px"
                      {...(i === 0 ? { priority: true } : {})}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {post.healthLog && !isOwner && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={copied || copying}
            className="mt-3 w-full text-xs"
          >
            {copied ? "✓ Saved to My Book" : "+ Save Routine to My Book"}
          </Button>
        )}

        {post.poll && <PostPollCard poll={post.poll} />}
        {post.templateType === "QUIZ" && post.templateData && (
          <PostQuizCard
            postId={post.id}
            question={(post.templateData as { question?: string })?.question || ""}
            options={(post.templateData as { options?: string[] })?.options || []}
            correctIndex={(post.templateData as { correctIndex?: number })?.correctIndex ?? 0}
          />
        )}

        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            <strong className="text-foreground">{localReactionCount}</strong> reactions
          </span>
          <span>
            <strong className="text-foreground">{post._count?.comments ?? 0}</strong> comments
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-[var(--border-subtle)] pt-2">
          <ReactionBar postId={post.id} userReaction={localReaction} onReaction={handleReaction} />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleShare}
              aria-label="Share"
              className="text-muted-foreground hover:text-foreground"
            >
              <Share2 />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSave}
              aria-label={isSaved ? "Unsave post" : "Save post"}
              className={cn(
                "text-muted-foreground hover:text-foreground",
                isSaved && "text-brand-teal hover:text-brand-teal",
              )}
            >
              {isSaved ? <BookmarkCheck /> : <Bookmark />}
            </Button>
          </div>
        </div>

        <div className="mt-2 border-t border-[var(--border-subtle)] pt-2">
          <CommentSection postId={post.id} postUserId={post.userId} />
        </div>
      </GlassCard>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={post.mediaUrls.map((u: string) => getImageUrl(u, "q_auto:best,f_auto") ?? u)}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
      {editPostId && (
        <CreatePostModal
          open={true}
          onClose={() => setEditPostId(null)}
          initialPost={{ id: post.id, content: post.content || "", privacy: post.privacy }}
        />
      )}
    </motion.div>
  );
});
