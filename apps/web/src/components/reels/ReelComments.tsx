"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppSelector } from "@/hooks";
import { slideUp } from "@/lib/motion/variants";
import {
  useAddReelCommentMutation,
  useDeleteReelCommentMutation,
  useGetReelQuery,
} from "@/redux/api/reelsApi";
import type { ReelComment } from "@/types/reel";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ReelComments({
  reelId,
  open,
  onClose,
}: {
  reelId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [content, setContent] = useState("");
  const { data: reel } = useGetReelQuery(reelId);
  const [addComment, { isLoading: adding }] = useAddReelCommentMutation();
  const [deleteComment, { isLoading: deleting }] = useDeleteReelCommentMutation();
  const currentUserId = useAppSelector((s) => s.auth.user?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await addComment({ reelId, content: content.trim() }).unwrap();
      setContent("");
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment({ reelId, commentId }).unwrap();
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const comments = reel?.comments ?? [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={slideUp}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute inset-x-0 bottom-0 z-30 max-h-[50%] rounded-t-2xl border-t border-white/10 bg-black/95 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-bold text-white">Comments ({reel?.commentsCount || 0})</h3>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Close comments"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="max-h-60 space-y-0 overflow-y-auto px-4">
            {comments.length === 0 ? (
              <p className="py-8 text-center text-xs text-white/40">No comments yet</p>
            ) : (
              comments.map((c: ReelComment) => (
                <div
                  key={c.id}
                  className="flex items-start gap-2 border-b border-white/5 py-2.5 pr-1"
                >
                  <Avatar size="sm" className="size-7 shrink-0">
                    {c.user.avatar ? <AvatarImage src={c.user.avatar} alt={c.user.name} /> : null}
                    <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-[10px] text-white">
                      {c.user.name?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">
                      <span className="font-semibold text-white">{c.user.name}</span>
                      <span className="ml-1.5 text-white/70">{c.content}</span>
                    </p>
                    <span className="text-[10px] text-white/40">
                      {new Date(c.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {currentUserId && c.user.id === currentUserId && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deleting}
                      className="shrink-0 rounded-full p-1 text-white/30 hover:bg-white/10 hover:text-red-400 transition-colors"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-white/10 px-4 py-3"
          >
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add a comment..."
              maxLength={500}
              aria-label="Add a comment"
              className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
            />
            <button
              type="submit"
              disabled={!content.trim() || adding}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-brand-teal to-brand-green text-white shadow-[var(--shadow-glow-teal)] transition-transform active:scale-90 disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
