"use client";

import Image from "next/image";
import { memo, useState, useRef } from "react";
import type { Message } from "@/types/conversation";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useAppSelector } from "@/hooks";
import { useDeleteMessageMutation } from "@/redux/api/messagingApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, HelpCircle, BarChart3, MessageCircle, Trash2, MoreVertical } from "lucide-react";
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
import { toast } from "sonner";

function StoryReplyCard({ data }: { data: NonNullable<Message["storyReplyData"]> }) {
  const isQuiz = data.storyType === "quiz";
  const isPoll = data.storyType === "poll";

  if (data.storyType === "media" && data.commentText) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold opacity-80">
          <MessageCircle className="size-3.5" />
          Story Comment
        </div>
        {data.textOverlay && (
          <div className="overflow-hidden rounded-lg bg-black/10 p-2 text-xs italic opacity-70 dark:bg-white/10">
            &ldquo;{data.textOverlay}&rdquo;
          </div>
        )}
        <p className="text-sm">{data.commentText}</p>
      </div>
    );
  }

  if (isQuiz || isPoll) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold opacity-80">
          {isQuiz ? <HelpCircle className="size-3.5" /> : <BarChart3 className="size-3.5" />}
          {isQuiz ? "Quiz Answer" : "Poll Vote"}
        </div>
        {data.question && <p className="text-sm font-medium">{data.question}</p>}
        <div className="flex items-center gap-2 rounded-lg bg-black/10 px-3 py-2 dark:bg-white/10">
          <span className="text-sm">{data.selectedOption}</span>
          {data.correct === true && <Check className="size-4 text-brand-green" />}
          {data.correct === false && (
            <span className="text-[10px] font-semibold text-red-400">(Wrong)</span>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export const ChatBubble = memo(function ChatBubble({ message, isGroup }: { message: Message; isGroup?: boolean }) {
  const userId = useAppSelector((s) => s.auth.user?.id);
  const isOwn = message.senderId === userId;
  const canDelete = isOwn;
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<"me" | "everyone" | null>(null);
  const [deleteMessage] = useDeleteMessageMutation();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (message.isDeleted) return null;

  const isStoryReply =
    !!message.messageType &&
    ["story_comment", "story_quiz_answer", "story_poll_vote"].includes(message.messageType);
  const hasContent = message.content || message.mediaUrl || message.sharedPostId || isStoryReply;
  if (!hasContent) return null;

  const handleDelete = async (forAll: boolean) => {
    try {
      await deleteMessage({ messageId: message.id, conversationId: message.conversationId, forAll }).unwrap();
    } catch {
      toast.error("Failed to delete message");
    }
    setDeleteDialog(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    longPressTimer.current = setTimeout(() => {
      const touch = e.touches[0];
      setMenuPos({ x: touch.clientX, y: touch.clientY });
      setMenuOpen(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div
      className={cn("group flex gap-2 px-4 py-1", isOwn ? "flex-row-reverse" : "flex-row")}
      onTouchStart={canDelete ? handleTouchStart : undefined}
      onTouchEnd={canDelete ? handleTouchEnd : undefined}
      onTouchMove={canDelete ? handleTouchMove : undefined}
    >
      {!isOwn && (
        <Avatar size="sm" className="mt-1 size-7 shrink-0">
          {message.sender?.avatar ? <AvatarImage src={message.sender.avatar} alt="" /> : null}
          <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-[10px] text-white">
            {message.sender?.name?.charAt(0)?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("max-w-[75%]", isOwn ? "items-end" : "items-start")}>
        {isGroup && !isOwn && (
          <p className="mb-0.5 px-1 text-[11px] font-medium text-[var(--text-muted)]">
            {message.sender?.name}
          </p>
        )}
        <div className="relative">
          <div
            className={cn(
              "rounded-2xl px-4 py-2 text-sm leading-relaxed",
              isOwn
                ? "bg-gradient-to-r from-brand-teal to-brand-green text-white rounded-br-md"
                : "bg-[var(--bg-overlay)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-bl-md",
            )}
          >
            {isStoryReply ? (
              message.storyReplyData ? (
                <StoryReplyCard data={message.storyReplyData} />
              ) : (
                <div className="flex items-center gap-2 text-sm opacity-80">
                  <MessageCircle className="size-3.5" />
                  {message.messageType === "story_comment" ? "Story Comment" : "Story Reply"}
                </div>
              )
            ) : (
              <>
                {message.content && <p>{message.content}</p>}
                {message.mediaUrl && (
                  <div className={cn("overflow-hidden rounded-lg", message.content && "mt-2")}>
                    <Image
                      src={message.mediaUrl}
                      alt="Media"
                      className="w-full max-w-60 rounded-lg object-cover"
                      width={240}
                      height={240}
                    />
                  </div>
                )}
                {message.sharedPostId && !message.content && !message.mediaUrl && (
                  <span className="italic opacity-60">[Shared Post]</span>
                )}
              </>
            )}
          </div>

          {canDelete && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-[var(--bg-elevated)] opacity-0 shadow-[var(--shadow-card)] transition-opacity group-hover:opacity-100"
            >
              <MoreVertical className="size-3.5 text-[var(--text-muted)]" />
            </button>
          )}

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div
                className="fixed z-50 min-w-48 overflow-y-auto rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] max-h-60"
                style={menuPos ? { left: menuPos.x, top: menuPos.y, transform: "translate(-50%, -50%)" } : undefined}
              >
                {isOwn && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteDialog("me");
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-overlay)]"
                  >
                    <Trash2 className="size-3.5" /> Delete for me
                  </button>
                )}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setDeleteDialog("everyone");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 className="size-3.5" /> Delete for everyone
                </button>
              </div>
            </>
          )}
        </div>

        <span
          className={cn(
            "mt-0.5 block text-[10px] text-[var(--text-muted)]",
            isOwn ? "text-right" : "text-left",
          )}
        >
          {formatRelativeTime(message.createdAt)}
        </span>
      </div>

      <AlertDialog open={deleteDialog === "me"} onOpenChange={(o) => !o && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the message for you. Others can still see it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => handleDelete(false)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteDialog === "everyone"}
        onOpenChange={(o) => !o && setDeleteDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete for everyone?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the message for all participants. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => handleDelete(true)}>
              Delete for everyone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});
