"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Eye,
  MessageCircle,
  Send,
  Check,
  Trash2,
  X as XIcon,
  SmilePlus,
} from "lucide-react";
import type { StoryGroup } from "@/types/story";
import {
  useViewStoryMutation,
  useDeleteStoryMutation,
  useToggleStoryLikeMutation,
  useGetStoryViewsQuery,
  useVoteStoryPollMutation,
  useReactToStoryMutation,
  useGetStoryReactionsQuery,
} from "@/redux/api/storiesApi";
import { useCreateConversationMutation, useSendMessageMutation } from "@/redux/api/messagingApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAppSelector } from "@/hooks";
import { StoryViewsSheet } from "./StoryViewsSheet";
import { StoryReactionsSheet } from "./StoryReactionsSheet";
import { playLikeSound, playReactionSound, playCommentSound, playAdvanceSound } from "@/lib/sounds";

const SPRING_CONFIG = { type: "spring" as const, stiffness: 300, damping: 30 };

const QUICK_REACTIONS = ["❤️", "😂", "🔥"];
const ALL_REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "👍"];

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
  const [viewsOpen, setViewsOpen] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [showAllReactions, setShowAllReactions] = useState(false);
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
  const [dragYProgress, setDragYProgress] = useState(1);

  const userId = useAppSelector((s) => s.auth.user?.id);
  const [viewStory] = useViewStoryMutation();
  const [deleteStory] = useDeleteStoryMutation();
  const [toggleLike] = useToggleStoryLikeMutation();
  const [reactToStory] = useReactToStoryMutation();
  const [voteStoryPoll] = useVoteStoryPollMutation();
  const [createConversation] = useCreateConversationMutation();
  const [sendMessage] = useSendMessageMutation();
  const commentInputRef = useRef<HTMLInputElement>(null);
  const elapsedRef = useRef(0);
  const lastTickRef = useRef(0);
  const longPressRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const contentRef = useRef<HTMLDivElement>(null);

  const group = groups[groupIdx];
  const stories = group?.stories || [];
  const story = stories[storyIdx];
  const isOwner = userId && story?.userId === userId;

  const isInteractive = story?.type === "quiz" || story?.type === "poll";
  const isQuiz = story?.type === "quiz";
  const isPoll = story?.type === "poll";
  const isText = story?.type === "text";
  const isMedia = story?.type === "media";

  const { data: viewsData } = useGetStoryViewsQuery(story?.id ?? "", { skip: !isOwner || !story });
  const { data: reactionsData } = useGetStoryReactionsQuery(story?.id ?? "", {
    skip: !reactionsOpen || !story,
  });

  useEffect(() => {
    if (showComment && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [showComment]);

  const advance = useCallback(() => {
    if (isInteractive) return;
    if (storyIdx < stories.length - 1) {
      setActiveIdx([storyIdx + 1, 1]);
      setStoryIdx((i) => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setActiveIdx([0, 1]);
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

  useEffect(() => {
    if (!story) return;
    elapsedRef.current = 0;
    lastTickRef.current = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  useEffect(() => {
    if (!story || paused || isInteractive) return;
    const duration = story.duration || (isText ? 8000 : 10000);
    lastTickRef.current = Date.now();

    const id = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / duration;
      elapsedRef.current += delta;
      lastTickRef.current = now;

      if (elapsedRef.current >= 1) {
        clearInterval(id);
        advanceRef.current();
      } else {
        setProgress(elapsedRef.current);
      }
    }, 50);

    return () => {
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, paused, isInteractive, isText]);

  useEffect(() => {
    if (story && !story.viewed) viewStory(story.id);
  }, [story, viewStory]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const textPos = useMemo(() => {
    if (!story?.textPosition) return { x: 50, y: 20 };
    try {
      const parsed = JSON.parse(story.textPosition);
      if (typeof parsed.x === "number")
        return { x: Math.max(0, Math.min(100, parsed.x)), y: Math.max(0, Math.min(100, parsed.y)) };
    } catch {
      /* fall through to legacy */
    }
    if (story.textPosition === "top") return { x: 50, y: 15 };
    if (story.textPosition === "bottom") return { x: 50, y: 75 };
    return { x: 50, y: 40 };
  }, [story?.textPosition]);

  const goBack = useCallback(() => {
    if (storyIdx > 0) {
      setActiveIdx([storyIdx - 1, -1]);
      setStoryIdx((i) => i - 1);
    } else if (groupIdx > 0) {
      const prevLen = groups[groupIdx - 1]?.stories?.length || 0;
      setActiveIdx([prevLen - 1, -1]);
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
      setActiveIdx([storyIdx + 1, 1]);
      setStoryIdx((i) => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setActiveIdx([0, 1]);
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
      playAdvanceSound();
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
      await toggleLike(story.id).unwrap();
      if (!story.liked) toast.success("Liked!");
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

    if (story.userId === userId) {
      toast.success("Wrote on your story!");
      setCommentText("");
      setShowComment(false);
      setPaused(false);
      return;
    }

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
      toast.success("Comment sent!");
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
      const result = await reactToStory({ storyId: story.id, emoji }).unwrap();
      if (result.reacted) toast.success(emoji);
    } catch {
      toast.error("Failed to react");
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    if (showComment) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) goBack();
    else if (x > rect.width * 0.7) goNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.3}
        onDrag={(_, info) => {
          setDragYProgress(Math.max(0, 1 - Math.abs(info.offset.y) / 300));
        }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100) onClose();
          setDragYProgress(1);
        }}
        style={{ opacity: dragYProgress, scale: 0.9 + dragYProgress * 0.1 }}
        className="relative aspect-[9/16] h-full max-h-[90vh] w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]"
      >
        {/* Progress Bar */}
        <div className="absolute inset-x-0 top-2 z-10 flex gap-1 px-2">
          {stories.map((s, i) => (
            <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
              <div
                className={cn(
                  "h-full rounded-full bg-white transition-all duration-75 ease-linear shadow-glow-teal",
                  i < storyIdx
                    ? "w-full"
                    : i === storyIdx && !isInteractive
                      ? ""
                      : i === storyIdx
                        ? "w-0"
                        : "w-0",
                )}
                style={
                  i === storyIdx && !isInteractive ? { width: `${progress * 100}%` } : undefined
                }
              />
            </div>
          ))}
        </div>

        {/* Top Bar */}
        <div className="absolute inset-x-0 top-3 z-10 flex items-center gap-2 px-3">
          <Avatar size="sm" className="size-8">
            {group.user.avatar ? (
              <AvatarImage src={group.user.avatar} alt={group.user.name} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-xs text-white">
              {group.user.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold text-white">{group.user.name}</span>
          <span className="text-xs text-white/60">
            {new Date(story.createdAt).toLocaleTimeString()}
          </span>
          <div className="ml-auto flex gap-2">
            {isOwner && (
              <>
                <button
                  onClick={() => setViewsOpen(true)}
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
              onClick={onClose}
              className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Story Content with AnimatePresence */}
        <div
          ref={contentRef}
          className="relative h-full w-full overflow-hidden"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.x > 60) {
                goBack();
              } else if (info.offset.x < -60) {
                goNext();
              }
            }}
            className="h-full w-full"
          >
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
                  className={cn(
                    "relative flex h-full w-full items-center justify-center",
                    !isMedia && "h-full",
                  )}
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

                {/* Text Overlay (media + text stories) */}
                {story.textOverlay && (isMedia || isText) && (
                  <div
                    className="pointer-events-none absolute z-10 select-none text-center drop-shadow-lg"
                    style={{
                      left: `${textPos.x}%`,
                      top: `${textPos.y}%`,
                      transform: "translate(-50%, 0)",
                      color: story.textColor || "#ffffff",
                      fontSize: story.textFontSize ? `${story.textFontSize}px` : "24px",
                      fontWeight: story.textFontWeight || "bold",
                      textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                    }}
                  >
                    {story.textOverlay}
                  </div>
                )}

                {/* Quiz / Poll Content */}
                {(isQuiz || isPoll) && story.stickerData && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
                    {story.stickerData.question && (
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="absolute text-center drop-shadow-2xl"
                        style={{
                          left: `${textPos.x}%`,
                          top: `${textPos.y}%`,
                          transform: "translate(-50%, 0)",
                          color: story.textColor || "#ffffff",
                          fontSize: story.textFontSize ? `${story.textFontSize}px` : "22px",
                          fontWeight: story.textFontWeight || "bold",
                          textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                        }}
                      >
                        {story.stickerData.question}
                      </motion.p>
                    )}
                    <div className="w-full space-y-2.5">
                      {(story.stickerData.options || []).map((opt: string, idx: number) => {
                        const voted = pollResults?.userVote?.optionIndex === idx;
                        const isCorrect = pollResults?.correctOptionIndex === idx;
                        const isWrong =
                          voted &&
                          isQuiz &&
                          pollResults?.correctOptionIndex !== undefined &&
                          pollResults.userVote?.optionIndex !== pollResults.correctOptionIndex;

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
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="relative overflow-hidden rounded-xl bg-white/10 px-3 py-2.5"
                            >
                              <motion.div
                                className={cn(
                                  "absolute inset-y-0 left-0 rounded-xl",
                                  isCorrect
                                    ? "bg-brand-green/40"
                                    : voted
                                      ? "bg-red-500/40"
                                      : "bg-brand-teal/30",
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                              />
                              <div className="relative flex items-center justify-between">
                                <span className="text-sm text-white">{opt}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-white/80">
                                    {percentage}%
                                  </span>
                                  {isCorrect && <Check className="size-4 text-brand-green" />}
                                  {isWrong && <XIcon className="size-4 text-red-400" />}
                                </div>
                              </div>
                            </motion.div>
                          );
                        }

                        return (
                          <motion.button
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleVote(idx)}
                            className="w-full rounded-xl border border-white/20 px-4 py-3 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
                          >
                            {opt}
                          </motion.button>
                        );
                      })}
                    </div>
                    {pollResults && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 text-center text-[10px] text-white/60"
                      >
                        {pollResults.totalVotes} vote{pollResults.totalVotes !== 1 ? "s" : ""}
                      </motion.p>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Heart Burst */}
            <HeartBurst active={likeAnimating} />

            {/* Double-tap hint on first open */}
            {story.likeCount === 0 &&
              !story.liked &&
              groupIdx === initialIndex &&
              storyIdx === 0 && (
                <motion.div
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -20 }}
                  transition={{ delay: 2, duration: 0.5 }}
                  className="pointer-events-none absolute bottom-40 left-1/2 z-20 -translate-x-1/2 text-center"
                >
                  <p className="text-xs text-white/40">Tap to navigate</p>
                </motion.div>
              )}
            {/* close swipe wrapper */}
          </motion.div>
        </div>

        {/* Comment Input */}
        <AnimatePresence>
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
                  whileHover={{ scale: 1.05 }}
                  className="flex size-9 items-center justify-center rounded-full bg-gradient-to-r from-brand-teal to-brand-green text-white transition-all disabled:opacity-50"
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
                  <X className="size-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reaction animation overlay */}
        <AnimatePresence>
          {reactionAnimating && (
            <motion.div
              key={reactionAnimating}
              initial={{ scale: 0, opacity: 1, y: 0 }}
              animate={{ scale: 2, opacity: 0, y: -120 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="pointer-events-none absolute bottom-28 left-1/2 z-30 -translate-x-1/2 text-3xl"
            >
              {reactionAnimating}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chevron Navigation */}
        <button
          onClick={goBack}
          className={cn(
            "absolute left-1 top-1/2 -translate-y-1/2 rounded-full p-4 text-white/50 hover:bg-white/10 hover:text-white",
            storyIdx === 0 && groupIdx === 0 && "hidden",
          )}
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={goNext}
          className={cn(
            "absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-4 text-white/50 hover:bg-white/10 hover:text-white",
            storyIdx === stories.length - 1 && groupIdx === groups.length - 1 && "hidden",
          )}
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Bottom Bar: Like + Quick Reactions + Comment */}
        {!showComment && (
          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-2 pt-10">
            <div className="flex items-center justify-around px-4">
              {/* Like */}
              <motion.button
                onClick={handleLike}
                whileTap={{ scale: 1.2 }}
                className="flex flex-col items-center gap-0.5"
              >
                <Heart
                  className={cn(
                    "size-6 transition-colors",
                    story.liked ? "fill-red-500 text-red-500" : "text-white",
                  )}
                />
                {story.likeCount > 0 && (
                  <span className="text-[10px] font-semibold text-white/80">{story.likeCount}</span>
                )}
              </motion.button>

              {/* Quick Reactions */}
              {!isInteractive && (
                <div className="flex items-center gap-2">
                  {QUICK_REACTIONS.map((emoji) => (
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
                  <motion.button
                    onClick={() => setShowAllReactions(!showAllReactions)}
                    whileTap={{ scale: 0.9 }}
                    className="flex size-9 items-center justify-center rounded-full bg-black/30 text-white/80 hover:bg-white/20"
                  >
                    <SmilePlus className="size-4" />
                  </motion.button>
                </div>
              )}

              {/* Reaction count (tap to see who reacted) */}
              {(story.reactionCount ?? 0) > 0 && (
                <motion.button
                  onClick={() => {
                    setReactionsOpen(true);
                    setPaused(true);
                  }}
                  whileTap={{ scale: 1.1 }}
                  className="flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1"
                >
                  <SmilePlus className="size-3.5 text-white/80" />
                  <span className="text-xs font-semibold text-white/90">{story.reactionCount}</span>
                </motion.button>
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

            {/* Expanded reactions picker */}
            <AnimatePresence>
              {showAllReactions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex justify-center gap-2 px-4 pb-2 pt-3">
                    {ALL_REACTIONS.map((emoji) => (
                      <motion.button
                        key={emoji}
                        onClick={() => {
                          handleReaction(emoji);
                          setShowAllReactions(false);
                        }}
                        whileHover={{ scale: 1.3 }}
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          "flex size-10 items-center justify-center rounded-full text-xl transition-all",
                          story.reaction === emoji
                            ? "bg-white/20 ring-2 ring-brand-teal"
                            : "bg-black/30 hover:bg-white/20",
                        )}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {viewsOpen && viewsData && (
        <StoryViewsSheet views={viewsData} onClose={() => setViewsOpen(false)} />
      )}
      {reactionsOpen && reactionsData && (
        <StoryReactionsSheet reactions={reactionsData} onClose={() => setReactionsOpen(false)} />
      )}
    </motion.div>
  );
}
