"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { MessageCircleX, Send, Trash2, AlertTriangle } from "lucide-react";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { PostCard } from "@/components/post/PostCard";
import { useGetPostQuery } from "@/redux/api/postApi";
import {
  useGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} from "@/redux/api/commentApi";
import { useAppSelector } from "@/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { GlassCard } from "@/components/ui/glass-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatRelativeTime } from "@/lib/utils";
import type { Comment } from "@/types/comment";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, error } = useGetPostQuery(id);
  const { data: commentsData, isLoading: commentsLoading } = useGetCommentsQuery(
    { postId: id },
    { skip: !id },
  );
  const [createComment, { isLoading: submitting }] = useCreateCommentMutation();
  const [updateComment, { isLoading: updating }] = useUpdateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const post = data?.data;
  const comments = commentsData?.data?.comments || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !id) return;
    try {
      await createComment({
        postId: id,
        content: content.trim(),
        parentId: replyTo || undefined,
      }).unwrap();
      setContent("");
      setReplyTo(null);
    } catch {
      toast.error("Failed to post comment");
    }
  };

  const handleEditStart = (commentId: string, content: string) => {
    setEditingId(commentId);
    setEditingContent(content);
  };

  const handleEditSave = async () => {
    if (!editingId || !editingContent.trim()) return;
    try {
      await updateComment({ commentId: editingId, content: editingContent.trim() }).unwrap();
      setEditingId(null);
      setEditingContent("");
    } catch {
      /* silent */
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const handleDelete = () => {
    if (!deletingId) return;
    deleteComment(deletingId);
    setDeletingId(null);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-[600px]">
          <Skeleton className="mb-4 h-6 w-32" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !post) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-[600px]">
          <Alert variant="destructive">
            <MessageCircleX />
            <AlertTitle>Post not found</AlertTitle>
            <AlertDescription>
              This post may have been deleted or you don&apos;t have access.
            </AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-[600px]">
        <PostCard post={post} />

        <section className="mt-6 sm:mt-8">
          <h2 className="mb-3 sm:mb-4 font-display text-lg font-bold">Comments</h2>
          <GlassCard variant="subtle" className="p-4">
            {commentsLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <Empty>
                <EmptyMedia variant="gradient">
                  <MessageCircleX />
                </EmptyMedia>
                <EmptyTitle>No comments yet</EmptyTitle>
                <EmptyDescription>Be the first to share your thoughts.</EmptyDescription>
              </Empty>
            ) : (
              <div className="flex flex-col gap-4">
                {comments.map((comment: Comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Link href={`/${comment.user.username}`} prefetch={false}>
                      <UserAvatar
                        name={comment.user.name}
                        avatar={comment.user.avatar}
                        size="default"
                      />
                    </Link>
                    <div className="flex-1">
                      <div className="rounded-2xl rounded-tl-md border border-[var(--glass-border)] bg-[var(--bg-overlay)] px-3 py-2">
                        <Link
                          href={`/${comment.user.username}`}
                          prefetch={false}
                          className="text-sm font-semibold hover:underline"
                        >
                          {comment.user.name}
                        </Link>
                        {editingId === comment.id ? (
                          <div className="mt-1 flex flex-col gap-2">
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full resize-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-sm focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleEditSave}
                                disabled={!editingContent.trim() || updating}
                                className="rounded-lg bg-gradient-to-r from-brand-teal to-brand-green px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                              >
                                {updating ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={handleEditCancel}
                                className="rounded-lg border border-[var(--border-default)] px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-[var(--bg-overlay)]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-0.5 text-sm">{comment.content}</p>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatRelativeTime(new Date(comment.createdAt))}</span>
                        <button
                          onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                          className="font-medium hover:text-foreground"
                        >
                          Reply
                        </button>
                        {user?.id === comment.userId && (
                          <>
                            <button
                              onClick={() => handleEditStart(comment.id, comment.content)}
                              className="font-medium hover:text-foreground"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeletingId(comment.id)}
                              className="font-medium text-destructive hover:underline"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>

                      {comment.replies?.map((reply: Comment) => (
                        <div key={reply.id} className="ml-6 mt-3 flex gap-2">
                          <UserAvatar name={reply.user.name} avatar={reply.user.avatar} size="sm" />
                          <div className="flex-1">
                            <div className="rounded-2xl rounded-tl-md border border-[var(--glass-border)] bg-[var(--bg-overlay)] px-3 py-2">
                              <Link
                                href={`/${reply.user.username}`}
                                prefetch={false}
                                className="text-sm font-semibold hover:underline"
                              >
                                {reply.user.name}
                              </Link>
                              {editingId === reply.id ? (
                                <div className="mt-1 flex flex-col gap-2">
                                  <textarea
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    className="w-full resize-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-sm focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={handleEditSave}
                                      disabled={!editingContent.trim() || updating}
                                      className="rounded-lg bg-gradient-to-r from-brand-teal to-brand-green px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                                    >
                                      {updating ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                      onClick={handleEditCancel}
                                      className="rounded-lg border border-[var(--border-default)] px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-[var(--bg-overlay)]"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="mt-0.5 text-sm">{reply.content}</p>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{formatRelativeTime(new Date(reply.createdAt))}</span>
                              {user?.id === reply.userId && (
                                <>
                                  <button
                                    onClick={() => handleEditStart(reply.id, reply.content)}
                                    className="font-medium hover:text-foreground"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => setDeletingId(reply.id)}
                                    className="font-medium text-destructive hover:underline"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {replyTo && (
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-brand-teal/30 bg-brand-teal/5 px-3 py-1.5 text-xs">
                <span className="text-muted-foreground">Replying to comment</span>
                <button
                  onClick={() => setReplyTo(null)}
                  className="font-semibold text-brand-teal hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
              <UserAvatar name={user?.name} avatar={user?.avatar} size="default" />
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
                className="flex-1 rounded-full"
              />
              <Button
                type="submit"
                variant="gradient"
                size="icon"
                disabled={!content.trim() || submitting}
                aria-label="Post comment"
              >
                <Send />
              </Button>
            </form>
          </GlassCard>
        </section>
      </div>

      <AlertDialog open={Boolean(deletingId)} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The comment will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2 />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}
