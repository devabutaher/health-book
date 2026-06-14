"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Pin, Trash2, AlertTriangle } from "lucide-react";
import {
  useGetCommentsQuery,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useTogglePinMutation,
} from "@/redux/api/commentApi";
import { useAppSelector } from "@/hooks";
import type { Comment } from "@/types/comment";
import { UserAvatar } from "@/components/shared/UserAvatar";
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
import { formatRelativeTime } from "@/lib/utils";  import { ErrorBoundary } from "@/components/ui/error-boundary";
import { CommentForm } from "./CommentForm";

export function CommentSection({ postId, postUserId, expandTrigger }: { postId: string; postUserId?: string; expandTrigger?: number }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expandTrigger) {
      queueMicrotask(() => setExpanded(true));
    }
  }, [expandTrigger]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const user = useAppSelector((s) => s.auth.user);

  const { data, isLoading } = useGetCommentsQuery({ postId }, { skip: !expanded });
  const [updateComment, { isLoading: updating }] = useUpdateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [togglePin] = useTogglePinMutation();

  const comments = data?.data?.comments || [];

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

  return (
    <ErrorBoundary>
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? (
            <>
              <ChevronUp className="size-4" /> Hide comments
            </>
          ) : (
            <>
              <ChevronDown className="size-4" /> View comments
            </>
          )}
        </button>

        {expanded && (
          <div className="mt-3 flex flex-col gap-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Be the first to comment.</p>
            ) : (
              comments.map((comment: Comment) => (
                <div key={comment.id} className="flex gap-2">
                  <UserAvatar name={comment.user.name} avatar={comment.user.avatar} size="sm" />
                  <div className="flex-1">
                    <div className="rounded-2xl rounded-tl-md border border-[var(--glass-border)] bg-[var(--bg-overlay)] px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/${comment.user.username}`}
                          prefetch={false}
                          className="text-sm font-semibold hover:underline"
                        >
                          {comment.user.name}
                        </Link>
                        {comment.isPinned && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-brand-amber">
                            <Pin className="size-3" /> Pinned
                          </span>
                        )}
                      </div>
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
                      {postUserId === user?.id && !comment.parentId && (
                        <button
                          onClick={() => togglePin(comment.id)}
                          className="font-medium hover:text-foreground"
                        >
                          {comment.isPinned ? "Unpin" : "Pin"}
                        </button>
                      )}
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
              ))
            )}

            {replyTo && (
              <div className="flex items-center justify-between rounded-2xl border border-brand-teal/30 bg-brand-teal/5 px-3 py-1.5 text-xs">
                <span className="text-muted-foreground">Replying to comment</span>
                <button
                  onClick={() => setReplyTo(null)}
                  className="font-semibold text-brand-teal hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}

            <CommentForm postId={postId} />
          </div>
        )}

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
      </div>
    </ErrorBoundary>
  );
}
