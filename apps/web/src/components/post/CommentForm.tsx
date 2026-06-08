"use client";

import { memo, useCallback, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useCreateCommentMutation } from "@/redux/api/commentApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSound } from "@/hooks/useSound";

export const CommentForm = memo(function CommentForm({
  postId,
  onCommentAdded,
}: {
  postId: string;
  onCommentAdded?: () => void;
}) {
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [createComment, { isLoading: submitting }] = useCreateCommentMutation();
  const { play } = useSound();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim()) return;
      play("reaction");
      try {
        await createComment({
          postId,
          content: content.trim(),
          parentId: replyTo || undefined,
        }).unwrap();
        setContent("");
        setReplyTo(null);
        onCommentAdded?.();
      } catch {
        play("error");
        toast.error("Failed to post comment");
      }
    },
    [content, postId, replyTo, createComment, play, onCommentAdded],
  );

  const handleCancelReply = useCallback(() => setReplyTo(null), []);

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2">
      {replyTo && (
        <button
          type="button"
          onClick={handleCancelReply}
          className="shrink-0 rounded-full bg-brand-teal/10 px-2 py-1 text-[10px] font-medium text-brand-teal transition-colors hover:bg-brand-teal/20"
        >
          Replying · Cancel
        </button>
      )}
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
        className="shrink-0 rounded-full"
      >
        <Send />
      </Button>
    </form>
  );
});
