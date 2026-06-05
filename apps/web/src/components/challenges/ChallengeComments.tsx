"use client";

import { useState, useCallback } from "react";
import { MessageCircle, Send, Trash2, ChevronDown } from "lucide-react";
import {
  useGetChallengeCommentsQuery,
  useAddChallengeCommentMutation,
  useDeleteChallengeCommentMutation,
  useReactToChallengeCommentMutation,
} from "@/redux/api/challengesApi";
import { useAppSelector } from "@/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSound } from "@/hooks/useSound";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type { ChallengeCommentReaction } from "@/types/challenge";

const reactionEmojis: Record<string, string> = {
  INSPIRED: "🌟",
  CLAP: "👏",
  KEEP_IT_UP: "💪",
  HEALING: "❤️‍🩹",
  LOVE: "❤️",
  FIRE: "🔥",
  STRONG: "💯",
  HUNDRED: "💯",
};

function CommentReactions({
  reactions,
  commentId,
  currentUserId,
}: {
  reactions?: ChallengeCommentReaction[];
  commentId: string;
  currentUserId?: string;
}) {
  const [reactToComment] = useReactToChallengeCommentMutation();

  if (!reactions?.length) return null;

  const grouped = reactions.reduce<Record<string, { count: number; hasMine: boolean }>>(
    (acc, r) => {
      if (!acc[r.type]) acc[r.type] = { count: 0, hasMine: false };
      acc[r.type]!.count++;
      if (r.userId === currentUserId) acc[r.type]!.hasMine = true;
      return acc;
    },
    {},
  );

  const handleReact = async (type: string) => {
    try {
      await reactToComment({ commentId, type }).unwrap();
    } catch {}
  };

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {Object.entries(grouped).map(([type, { count, hasMine }]) => (
        <button
          key={type}
          onClick={() => handleReact(type)}
          className={cn(
            "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] transition-colors",
            hasMine
              ? "bg-brand-teal/10 text-brand-teal"
              : "bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]",
          )}
        >
          <span>{reactionEmojis[type] || type}</span>
          <span>{count}</span>
        </button>
      ))}
    </div>
  );
}

export function ChallengeComments({ challengeId }: { challengeId: string }) {
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const { data, isLoading, isFetching } = useGetChallengeCommentsQuery({ challengeId, cursor });
  const [addComment, { isLoading: adding }] = useAddChallengeCommentMutation();
  const [deleteComment] = useDeleteChallengeCommentMutation();
  const { play } = useSound();

  const comments = data?.comments || [];

  const loadMore = useCallback(() => {
    if (!data?.hasMore || isFetching) return;
    setCursor(data.nextCursor || undefined);
  }, [data, isFetching]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    try {
      await addComment({
        challengeId,
        content: content.trim(),
        parentId: replyTo || undefined,
      }).unwrap();
      setContent("");
      setReplyTo(null);
      play("success");
      toast.success("Comment added!");
    } catch {
      play("error");
      toast.error("Failed to add comment");
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId).unwrap();
      play("success");
      toast.success("Comment deleted");
    } catch {
      play("error");
      toast.error("Failed to delete");
    }
  };

  return (
    <GlassCard variant="elevated" className="p-4 sm:p-5">
      <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-[var(--text-primary)]">
        <MessageCircle className="size-4 text-brand-teal" />
        Comments ({comments.length})
      </h2>

      <div className="mb-4 flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={replyTo ? "Write a reply..." : "Share your thoughts..."}
          className="flex-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
        <Button
          variant="gradient"
          size="icon-sm"
          onClick={handleSubmit}
          disabled={!content.trim() || adding}
        >
          <Send className="size-3.5" />
        </Button>
      </div>
      {replyTo && (
        <button
          onClick={() => setReplyTo(null)}
          className="mb-2 text-[10px] text-brand-teal hover:underline"
        >
          Cancel reply
        </button>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
          ))}
        </div>
      ) : !comments.length ? (
        <p className="py-6 text-center text-xs text-[var(--text-muted)]">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id}>
              <div className="flex items-start gap-2 rounded-xl p-2 transition-colors hover:bg-[var(--bg-overlay)]">
                <Avatar size="sm" className="size-7 shrink-0">
                  {c.user.avatar ? <AvatarImage src={c.user.avatar} /> : null}
                  <AvatarFallback className="text-[10px]">{c.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {c.user.name}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                    {currentUserId === c.userId && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="ml-auto text-[var(--text-muted)] hover:text-red-500"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{c.content}</p>
                  <CommentReactions
                    reactions={c.reactions}
                    commentId={c.id}
                    currentUserId={currentUserId}
                  />
                  <button
                    onClick={() => {
                      setReplyTo(c.id);
                      setContent("");
                    }}
                    className="mt-0.5 text-[10px] font-semibold text-brand-teal hover:underline"
                  >
                    Reply
                  </button>
                </div>
              </div>
              {c.replies && c.replies.length > 0 && (
                <div className="ml-8 space-y-2 border-l-2 border-[var(--border-default)] pl-3">
                  {c.replies.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-start gap-2 rounded-xl p-2 transition-colors hover:bg-[var(--bg-overlay)]"
                    >
                      <Avatar size="sm" className="size-6 shrink-0">
                        {r.user.avatar ? <AvatarImage src={r.user.avatar} /> : null}
                        <AvatarFallback className="text-[10px]">
                          {r.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            {r.user.name}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">{r.content}</p>
                        <CommentReactions
                          reactions={r.reactions}
                          commentId={r.id}
                          currentUserId={currentUserId}
                        />
                      </div>
                    </div>
                  ))}
                  {(c._count?.replies ?? 0) > 3 && (
                    <p className="text-[10px] text-[var(--text-muted)]">
                      +{(c._count?.replies ?? 0) - 3} more replies
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {data?.hasMore && (
            <Button
              variant="secondary"
              size="sm"
              onClick={loadMore}
              disabled={isFetching}
              className="mt-3 w-full"
            >
              <ChevronDown className="size-3.5" />
              {isFetching ? "Loading..." : "Load More"}
            </Button>
          )}
        </div>
      )}
    </GlassCard>
  );
}
