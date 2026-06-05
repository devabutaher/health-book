"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppSelector } from "@/hooks";
import { playAdvanceSound, playCommentSound, playLikeSound, playReactionSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { useCreateConversationMutation, useSendMessageMutation } from "@/redux/api/messagingApi";
import {
  useDeleteStoryMutation,
  useGetStoryInteractionsQuery,
  useReactToStoryMutation,
  useViewStoryMutation,
  useVoteStoryPollMutation,
} from "@/redux/api/storiesApi";
import type { StoryGroup } from "@/types/story";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  MessageCircle,
  Pause,
  Play,
  Send,
  Trash2,
  X,
  X as XIcon,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { StoryInteractionsSheet } from "./StoryInteractionsSheet";

const SPRING_CONFIG = { type: "spring" as const, stiffness: 300, damping: 30 };
const ALL_REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "👍"];

// Relative time helper
function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function HeartBurst({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 2.5, opacity: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Heart className="size-24 fill-white text-white" />
      </motion.div>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute size-3 rounded-full bg-white"
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((i * 60 * Math.PI) / 180) * 80,
            y: Math.sin((i * 60 * Math.PI) / 180) * 80,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.6, delay: 0.1 }}
        />
      ))}
    </div>
  );
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

export function StoryViewer({
  groups,
  initialIndex,
  onClose,
}: {
  groups: StoryGroup[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [groupIdx, setGroupIdx] = useState(initialIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [[, direction], setActiveIdx] = useState([0, 0]);
  const [interactionsOpen, setInteractionsOpen] = useState(false);
  const [pollResults, setPollResults] = useState<{
    question?: string;
    options: string[];
    votes: { optionIndex: number; count: number }[];
    totalVotes: number;
    correctOptionIndex?: number;
    userVote: { optionIndex: number } | null;
  } | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [reactionAnimating, setReactionAnimating] = useState<string | null>(null);

  const userId = useAppSelector((s) => s.auth.user?.id);
  const [viewStory] = useViewStoryMutation();
  const [deleteStory] = useDeleteStoryMutation();
  const [reactToStory] = useReactToStoryMutation();
  const [voteStoryPoll] = useVoteStoryPollMutation();
  const [createConversation] = useCreateConversationMutation();
  const [sendMessage] = useSendMessageMutation();
  const commentInputRef = useRef<HTMLInputElement>(null);
  const elapsedRef = useRef(0);
  const lastTickRef = useRef(0);
  const longPressRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  const lastTapRef = useRef(0);

  const group = groups[groupIdx];
  const stories = group?.stories || [];
  const story = stories[storyIdx];
  const isOwner = userId && story?.userId === userId;
  const isInteractive = story?.type === "quiz" || story?.type === "poll";
  const isQuiz = story?.type === "quiz";
  const isPoll = story?.type === "poll";
  const isText = story?.type === "text";
  const isMedia = story?.type === "media";

  const { data: interactionsData } = useGetStoryInteractionsQuery(story?.id ?? "", {
    skip: !interactionsOpen || !story,
  });

  useEffect(() => {
    if (showComment && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [showComment]);

  const advance = useCallback(() => {
    if (isInteractive) return;
    playAdvanceSound();
    if (storyIdx < stories.length - 1) {
      setActiveIdx(([, d]) => [storyIdx + 1, 1]);
      setStoryIdx((i) => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setActiveIdx(([, d]) => [0, 1]);
      setGroupIdx((i) => i + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
    setProgress(0);
    setPollResults(null);
    setShowComment(false);
    setCommentText("");
  }, [storyIdx, stories.length, groupIdx, groups.length, onClose, isInteractive]);

  const advanceRef = useRef(advance);
  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  // Single unified progress timer — no race condition
  useEffect(() => {
    if (!story) return;

    // Always reset on story change
    elapsedRef.current = 0;
    setProgress(0);

    const duration = story.duration ? story.duration * 1000 : isText ? 8000 : 10000;

    lastTickRef.current = performance.now();

    const id = setInterval(() => {
      const now = performance.now();

      // If paused, just update timestamp to avoid delta spike on resume
      if (pausedRef.current) {
        lastTickRef.current = now;
        return;
      }

      const delta = (now - lastTickRef.current) / duration;
      lastTickRef.current = now;
      elapsedRef.current += delta;

      if (elapsedRef.current >= 1) {
        clearInterval(id);
        advanceRef.current();
      } else {
        setProgress(elapsedRef.current);
      }
    }, 50);

    return () => clearInterval(id);
  }, [story?.id, isText]);

  useEffect(() => {
    if (story && !story.viewed) viewStory(story.id);
  }, [story?.id]);

  const goBack = useCallback(() => {
    if (storyIdx > 0) {
      setActiveIdx(([prev]) => [prev, -1]);
      setStoryIdx((i) => i - 1);
    } else if (groupIdx > 0) {
      const prevLen = groups[groupIdx - 1]?.stories?.length || 0;
      setActiveIdx(([prev]) => [prev, -1]);
      setGroupIdx((i) => i - 1);
      setStoryIdx(prevLen - 1);
    }
    setProgress(0);
    setPollResults(null);
    setShowComment(false);
    setCommentText("");
  }, [storyIdx, groupIdx, groups]);

  const goNext = useCallback(() => {
    if (storyIdx < stories.length - 1) {
      setActiveIdx(([prev]) => [prev, 1]);
      setStoryIdx((i) => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setActiveIdx(([prev]) => [prev, 1]);
      setGroupIdx((i) => i + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
    setProgress(0);
    setPollResults(null);
    setShowComment(false);
    setCommentText("");
  }, [storyIdx, stories.length, groupIdx, groups.length, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goBack();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goBack, goNext, onClose]);

  if (!story) return null;

  const handleDelete = async () => {
    try {
      await deleteStory(story.id).unwrap();
      toast.success("Story deleted");
      goNext();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleLike = async () => {
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 700);
    playLikeSound();
    try {
      await reactToStory({ storyId: story.id, emoji: "❤️" }).unwrap();
    } catch {
      toast.error("Failed to like story");
    }
  };

  const handlePointerDown = () => {
    longPressRef.current = setTimeout(() => setPaused(true), 400);
  };


  const handlePointerUp = () => {
    clearTimeout(longPressRef.current);
    if (paused) setPaused(false);
  };

  const handleVote = async (optionIndex: number) => {
    try {
      const result = await voteStoryPoll({ storyId: story.id, optionIndex }).unwrap();
      setPollResults(result);
      toast.success(story.type === "quiz" ? "Answered!" : "Voted!");

      if (story.userId !== userId) {
        try {
          const sticker = story.stickerData;
          const optionLabel = sticker?.options?.[optionIndex] ?? "";
          const conv = await createConversation({ participantIds: [story.userId] }).unwrap();
          await sendMessage({
            conversationId: conv.id,
            content: "",
            messageType: story.type === "quiz" ? "story_quiz_answer" : "story_poll_vote",
            storyId: story.id,
            storyReplyData: {
              storyType: story.type,
              question: sticker?.question,
              options: sticker?.options,
              selectedOption: optionLabel,
              optionIndex,
              correct:
                story.type === "quiz" ? optionIndex === sticker?.correctOptionIndex : undefined,
            },
          });
        } catch {
          /* best-effort */
        }
      }
    } catch {
      toast.error("Failed to vote");
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    playCommentSound();

    try {
      const conv = await createConversation({ participantIds: [story.userId] }).unwrap();
      await sendMessage({
        conversationId: conv.id,
        content: commentText.trim(),
        messageType: "story_comment",
        storyId: story.id,
        storyReplyData: {
          storyType: "media",
          commentText: commentText.trim(),
          textOverlay: story.textOverlay ?? undefined,
        },
      });
      toast.success(story.userId === userId ? "Note saved!" : "Comment sent!");
      setCommentText("");
      setShowComment(false);
      setPaused(false);
    } catch {
      toast.error("Failed to send comment");
    }
  };

  const handleReaction = async (emoji: string) => {
    setReactionAnimating(emoji);
    setTimeout(() => setReactionAnimating(null), 600);
    playReactionSound();
    try {
      await reactToStory({ storyId: story.id, emoji }).unwrap();
    } catch {
      toast.error("Failed to react");
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    if (showComment) return;

    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      lastTapRef.current = 0;
      handleLike();
      return;
    }
    lastTapRef.current = now;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) goBack();
    else if (x > rect.width * 0.7) goNext();
  };

  // Text position from story data
  const textPos = (() => {
    if (!story?.textPosition) return { x: 50, y: 20 };
    try {
      const parsed = JSON.parse(story.textPosition);
      if (typeof parsed.x === "number")
        return {
          x: Math.max(0, Math.min(100, parsed.x)),
          y: Math.max(0, Math.min(100, parsed.y)),
        };
    } catch {
      /* fall through */
    }
    if (story.textPosition === "top") return { x: 50, y: 15 };
    if (story.textPosition === "bottom") return { x: 50, y: 75 };
    return { x: 50, y: 40 };
  })();

  const userVoteIdx = pollResults?.userVote?.optionIndex;
  const isCorrectAnswer =
    userVoteIdx !== undefined && pollResults?.correctOptionIndex === userVoteIdx;

  return (
    <motion.div
      data-story-viewer=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 select-none"
      style={{ touchAction: "none" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative aspect-[9/16] h-full max-h-[90vh] w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]"
      >
        {/* Progress Bars */}
        <div className="absolute inset-x-0 top-2 z-10 flex gap-1 px-2">
          {stories.map((s, i) => (
            <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-none"
                style={
                    i < storyIdx
                    ? { width: "100%" }
                    : i === storyIdx
                      ? { width: `${progress * 100}%` }
                      : { width: "0%" }
                }
              />
            </div>
          ))}
        </div>

        {/* Top Bar */}
        <div className="absolute inset-x-0 top-5 z-20 flex items-center gap-2 px-3">
          <Avatar size="sm" className="size-8">
            {group.user.avatar ? (
              <AvatarImage src={group.user.avatar} alt={group.user.name} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-xs text-white">
              {group.user.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold text-white">{group.user.name}</span>
          <span className="text-xs text-white/50">{getRelativeTime(story.createdAt)}</span>
          <div className="ml-auto flex gap-1">
            {isOwner && (
              <>
                <button
                  onClick={() => {
                    setInteractionsOpen(true);
                    setPaused(true);
                  }}
                  className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <Eye className="size-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <Trash2 className="size-4" />
                </button>
              </>
            )}
              <button
                onClick={() => setPaused((p) => !p)}
                className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
              >
                {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
              </button>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="size-7" />
              </button>
          </div>
        </div>

        {/* Story Content */}
        <div
          className="relative h-full w-full overflow-hidden"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <div className="h-full w-full">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={story?.id || "empty"}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={SPRING_CONFIG}
                className="absolute inset-0"
              >
                <div
                  className={cn("relative flex h-full w-full items-center justify-center")}
                  style={
                    !isMedia && story.backgroundColor
                      ? { backgroundColor: story.backgroundColor }
                      : undefined
                  }
                  onClick={handleContentClick}
                >
                  {isMedia && story.mediaType === "video" ? (
                    <video
                      src={story.mediaUrl!}
                      className="h-full w-full object-contain"
                      autoPlay
                      playsInline
                      muted={paused}
                    />
                  ) : isMedia ? (
                    <Image
                      src={story.mediaUrl!}
                      alt={story.textOverlay || "Story"}
                      className="h-full w-full object-contain"
                      width={400}
                      height={712}
                    />
                  ) : null}
                </div>

                {/* Text Overlay */}
                {story.textOverlay && (isMedia || isText) && (
                  <div
                    className="pointer-events-none absolute z-10 select-none text-center drop-shadow-lg"
                    style={{
                      left: `${textPos.x}%`,
                      top: `${textPos.y}%`,
                      transform: "translate(-50%, 0)",
                    }}
                  >
                    {story.textBgColor && story.textBgColor !== "transparent" && (
                      <span
                        className="absolute inset-0 -inset-x-2 -inset-y-1 rounded-lg"
                        style={{ backgroundColor: story.textBgColor }}
                      />
                    )}
                    <span
                      className="relative"
                      style={{
                        color: story.textColor || "#ffffff",
                        fontSize: story.textFontSize ? `${story.textFontSize}px` : "24px",
                        fontWeight: story.textFontWeight || "bold",
                        textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                      }}
                    >
                      {story.textOverlay}
                    </span>
                  </div>
                )}

                {/* Quiz / Poll Content — improved layout */}
                {(isQuiz || isPoll) && story.stickerData && (
                  <>
                    {/* Left/right tap zones for navigation */}
                    <div
                      className="absolute inset-y-0 left-0 z-20"
                      style={{ width: "20%" }}
                      onClick={(e) => { e.stopPropagation(); goBack(); }}
                    />
                    <div
                      className="absolute inset-y-0 right-0 z-20"
                      style={{ width: "20%" }}
                      onClick={(e) => { e.stopPropagation(); goNext(); }}
                    />
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-5">
                      {/* Question card */}
                      {story.stickerData.question && (
                        <motion.div
                          initial={{ opacity: 0, y: -16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="w-full rounded-2xl bg-black/50 px-5 py-4 text-center backdrop-blur-sm"
                        >
                          <p
                            className="font-bold leading-snug drop-shadow-lg"
                            style={{
                              color: story.textColor || "#ffffff",
                              fontSize: story.textFontSize ? `${story.textFontSize}px` : "20px",
                              fontWeight: story.textFontWeight || "bold",
                            }}
                          >
                            {story.stickerData.question}
                          </p>
                        </motion.div>
                      )}

                      {/* Options */}
                      <div className="w-full space-y-2.5">
                        {(story.stickerData.options || []).map((opt: string, idx: number) => {
                          const voted = pollResults?.userVote?.optionIndex === idx;
                          const isCorrect = pollResults?.correctOptionIndex === idx;
                          const isWrong =
                            voted &&
                            isQuiz &&
                            pollResults?.correctOptionIndex !== undefined &&
                            !isCorrectAnswer;

                          if (pollResults) {
                            const voteCount =
                              pollResults.votes.find((v) => v.optionIndex === idx)?.count ?? 0;
                            const percentage =
                              pollResults.totalVotes > 0
                                ? Math.round((voteCount / pollResults.totalVotes) * 100)
                                : 0;

                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="relative overflow-hidden rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm"
                              >
                                <motion.div
                                  className={cn(
                                    "absolute inset-y-0 left-0 rounded-2xl",
                                    isCorrect
                                      ? "bg-brand-green/50"
                                      : voted
                                        ? "bg-red-500/40"
                                        : "bg-brand-teal/25",
                                  )}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.35, ease: "easeOut", delay: idx * 0.05 }}
                                />
                                <div className="relative flex items-center justify-between gap-3">
                                  <span className="text-sm font-medium text-white">{opt}</span>
                                  <div className="flex shrink-0 items-center gap-1.5">
                                    <span className="text-xs font-bold text-white">
                                      {percentage}%
                                    </span>
                                    {isCorrect && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                          type: "spring",
                                          stiffness: 400,
                                          damping: 15,
                                          delay: 0.3,
                                        }}
                                        className="flex size-5 items-center justify-center rounded-full bg-brand-green"
                                      >
                                        <Check className="size-3 text-white" />
                                      </motion.div>
                                    )}
                                    {isWrong && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                        className="flex size-5 items-center justify-center rounded-full bg-red-500"
                                      >
                                        <XIcon className="size-3 text-white" />
                                      </motion.div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }

                          return (
                            <motion.button
                              key={idx}
                              initial={{ opacity: 0, x: -16 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.08 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleVote(idx)}
                              className="w-full rounded-2xl border border-white/20 bg-white/15 px-5 py-3.5 text-left text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25 active:bg-white/30"
                            >
                              {opt}
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* Vote count */}
                      {pollResults && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center text-xs text-white/50"
                        >
                          {pollResults.totalVotes} vote{pollResults.totalVotes !== 1 ? "s" : ""}
                        </motion.p>
                      )}

                      {/* Quiz result feedback */}
                      {pollResults && isQuiz && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.4 }}
                          className={cn(
                            "flex items-center gap-2 rounded-2xl border px-4 py-2.5",
                            isCorrectAnswer
                              ? "border-brand-green/30 bg-brand-green/20"
                              : "border-red-500/30 bg-red-500/20",
                          )}
                        >
                          <span className="text-lg">{isCorrectAnswer ? "🎉" : "😅"}</span>
                          <span
                            className={cn(
                              "text-sm font-bold",
                              isCorrectAnswer ? "text-brand-green" : "text-red-400",
                            )}
                          >
                            {isCorrectAnswer ? "Correct!" : "Wrong answer"}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Heart Burst */}
            <HeartBurst active={likeAnimating} />
          </div>
        </div>

        {/* Comment Input */}
        {showComment && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={SPRING_CONFIG}
              className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/80 backdrop-blur-xl"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleComment();
                }}
                className="flex items-center gap-2 p-3"
              >
                <input
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Send a comment..."
                  maxLength={500}
                  className="flex-1 rounded-full bg-white/15 px-4 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
                <motion.button
                  type="submit"
                  disabled={!commentText.trim()}
                  whileTap={{ scale: 1.2 }}
                  className="flex size-9 items-center justify-center rounded-full bg-gradient-to-r from-brand-teal to-brand-green text-white disabled:opacity-50"
                >
                  <Send className="size-4" />
                </motion.button>
                <button
                  type="button"
                  onClick={() => {
                    setShowComment(false);
                    setCommentText("");
                    setPaused(false);
                  }}
                  className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"
                >
<X className="size-7" />
                </button>
              </form>
            </motion.div>
          )}

        {/* Reaction animation overlay */}
        {reactionAnimating && (
          <motion.div
            key={reactionAnimating}
            initial={{ scale: 0, opacity: 1, y: 0 }}
            animate={{ scale: 2, opacity: 0, y: -120 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none absolute bottom-28 left-1/2 z-30 -translate-x-1/2 text-3xl"
          >
            {reactionAnimating}
          </motion.div>
        )}

        {/* Chevron Navigation */}
        <button
          onClick={goBack}
          className={cn(
            "absolute left-1 top-1/2 -translate-y-1/2 z-20 rounded-full p-4 text-white/50 hover:bg-white/10 hover:text-white",
            storyIdx === 0 && groupIdx === 0 && "hidden",
          )}
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={goNext}
          className={cn(
            "absolute right-1 top-1/2 -translate-y-1/2 z-20 rounded-full p-4 text-white/50 hover:bg-white/10 hover:text-white",
            storyIdx === stories.length - 1 && groupIdx === groups.length - 1 && "hidden",
          )}
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Bottom Bar */}
        {!showComment && (
          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-3 pt-10">
            <div className="flex items-center justify-between px-4">
              {/* All 6 reactions inline */}
              {!isInteractive && (
                <div className="flex items-center gap-1.5">
                  {ALL_REACTIONS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full text-lg transition-all",
                        story.reaction === emoji
                          ? "bg-white/20 ring-2 ring-brand-teal"
                          : "bg-black/30 hover:bg-white/20",
                      )}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Comment */}
              <motion.button
                onClick={() => {
                  setShowComment(true);
                  setPaused(true);
                }}
                whileTap={{ scale: 1.2 }}
                className="flex flex-col items-center gap-0.5"
              >
                <MessageCircle className="size-6 text-white" />
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {interactionsOpen && interactionsData && (
        <StoryInteractionsSheet
          data={interactionsData}
          onClose={() => {
            setInteractionsOpen(false);
            setPaused(false);
          }}
        />
      )}
    </motion.div>
  );
}
