"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { PostPoll } from "@/types/post";
import { useVotePostPollMutation, useUnvotePostPollMutation } from "@/redux/api/postPollApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PostPollCard({ poll }: { poll: PostPoll }) {
  const [vote, { isLoading: isVoting }] = useVotePostPollMutation();
  const [unvote, { isLoading: isUnvoting }] = useUnvotePostPollMutation();

  const isExpired = useMemo(
    () => (poll.expiresAt ? new Date(poll.expiresAt) < new Date() : false),
    [poll.expiresAt],
  );
  const maxCount = Math.max(...poll.votes.map((v) => v._count), 0);

  const handleVote = async (optionIndex: number) => {
    try {
      await vote({ pollId: poll.id, optionIndex }).unwrap();
      toast.success("Vote recorded");
    } catch {
      toast.error("Failed to vote");
    }
  };

  const handleUnvote = async () => {
    try {
      await unvote({ pollId: poll.id }).unwrap();
      toast.success("Vote removed");
    } catch {
      toast.error("Failed to remove vote");
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-3">
      <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{poll.question}</p>

      <div className="space-y-2">
        {poll.options.map((option, idx) => {
          const voteCount = poll.votes.find((v) => v.optionIndex === idx)?._count ?? 0;
          const pct = maxCount > 0 ? (voteCount / maxCount) * 100 : 0;
          const isSelected = poll.userVote === idx;

          return (
            <motion.button
              key={idx}
              whileTap={
                !isExpired && (poll.isMultipleChoice || poll.userVote === null || isSelected)
                  ? { scale: 0.98 }
                  : undefined
              }
              onClick={() => (isSelected ? handleUnvote() : handleVote(idx))}
              disabled={
                isExpired ||
                isVoting ||
                isUnvoting ||
                (!poll.isMultipleChoice && poll.userVote !== null && !isSelected)
              }
              className={cn(
                "relative w-full overflow-hidden rounded-lg px-3 py-2 text-left text-sm transition-colors",
                isSelected
                  ? "bg-gradient-to-r from-brand-teal/20 to-brand-green/20 text-[var(--text-primary)] ring-1 ring-brand-teal/40"
                  : "bg-[var(--bg-overlay)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]",
                (isExpired || (!poll.isMultipleChoice && poll.userVote !== null && !isSelected)) &&
                  "cursor-not-allowed",
              )}
            >
              <motion.div
                className="absolute left-0 top-0 h-full rounded-lg bg-[var(--border-default)]"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
              />
              <span className="relative z-10 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <Check className="size-3.5 text-brand-teal" />
                    </motion.span>
                  )}
                  {option}
                </span>
                <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                  {isExpired || poll.userVote !== null ? voteCount : ""}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <span>
          {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
        </span>
        {poll.isMultipleChoice && <span>Multiple choice</span>}
        {isExpired && <span>Closed</span>}
      </div>

      {poll.userVote !== null && !isExpired && (
        <button
          onClick={handleUnvote}
          disabled={isUnvoting}
          className="mt-1.5 text-[10px] font-semibold text-[var(--text-muted)] transition-colors hover:text-brand-teal"
        >
          {isUnvoting ? "Removing..." : "Remove vote"}
        </button>
      )}
    </div>
  );
}
