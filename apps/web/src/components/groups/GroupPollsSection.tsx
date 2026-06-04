"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useSound } from "@/hooks/useSound";
import {
  useDeletePollMutation,
  useGetGroupPollsQuery,
  useUnvotePollMutation,
  useVotePollMutation,
} from "@/redux/api/groupPollApi";
import type { GroupPoll } from "@/types/groupPoll";
import { BarChart3, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CreatePollModal } from "./CreatePollModal";

const pollContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const pollItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

function PollCard({ poll, canManage }: { poll: GroupPoll; canManage: boolean }) {
  const [vote, { isLoading: isVoting }] = useVotePollMutation();
  const [unvote, { isLoading: isUnvoting }] = useUnvotePollMutation();
  const [deletePoll, { isLoading: isDeleting }] = useDeletePollMutation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { play } = useSound();

  const isExpired = useMemo(
    () => (poll.expiresAt ? new Date(poll.expiresAt) < new Date() : false),
    [poll.expiresAt],
  );
  const totalVotes = poll.totalVotes;

  const handleVote = async (optionIndex: number) => {
    try {
      await vote({ pollId: poll.id, groupId: poll.groupId, optionIndex }).unwrap();
      play("success");
      toast.success("Vote recorded");
    } catch {
      toast.error("Failed to vote");
    }
  };

  const handleUnvote = async () => {
    try {
      await unvote({ pollId: poll.id, groupId: poll.groupId }).unwrap();
      toast.success("Vote removed");
    } catch {
      toast.error("Failed to remove vote");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePoll({ pollId: poll.id, groupId: poll.groupId }).unwrap();
      toast.success("Poll deleted");
      setDeleteOpen(false);
    } catch {
      toast.error("Failed to delete poll");
    }
  };

  const maxCount = Math.max(...poll.votes.map((v) => v._count), 0);

  return (
    <GlassCard variant="elevated" className={`p-4 ${isExpired ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{poll.question}</h3>
            {isExpired && (
              <Badge variant="outline" className="shrink-0 text-[10px]">
                Closed
              </Badge>
            )}
            {poll.isMultipleChoice && (
              <Badge variant="outline" className="shrink-0 text-[10px] text-brand-teal">
                Multi
              </Badge>
            )}
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setDeleteOpen(true)}
            disabled={isDeleting}
            className="flex size-8 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-overlay)] hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-3 space-y-2">
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
              className={`relative w-full overflow-hidden rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                isSelected
                  ? "bg-gradient-to-r from-brand-teal/20 to-brand-green/20 text-[var(--text-primary)] ring-1 ring-brand-teal/40"
                  : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]"
              } ${isExpired || (!poll.isMultipleChoice && poll.userVote !== null && !isSelected) ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <motion.div
                className="absolute left-0 top-0 h-full rounded-xl bg-[var(--bg-overlay)]"
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
                <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                  {isExpired || poll.userVote !== null ? voteCount : ""}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>

      {poll.userVote !== null && !isExpired && (
        <button
          onClick={handleUnvote}
          disabled={isUnvoting}
          className="mt-2 text-[11px] font-semibold text-[var(--text-muted)] transition-colors hover:text-brand-teal"
        >
          {isUnvoting ? "Removing..." : "Remove vote"}
        </button>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this poll?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All votes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete Poll"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GlassCard>
  );
}

export function GroupPollsSection({ groupId, canManage }: { groupId: string; canManage: boolean }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: polls, isLoading, isError } = useGetGroupPollsQuery(groupId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
        <div className="h-24 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
      </div>
    );
  }

  if (isError) {
    return (
      <GlassCard variant="subtle" className="flex flex-col items-center py-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">Failed to load polls</p>
      </GlassCard>
    );
  }

  const active = (polls || []).filter((p) => !p.expiresAt || new Date(p.expiresAt) >= new Date());
  const closed = (polls || []).filter((p) => p.expiresAt && new Date(p.expiresAt) < new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
          Polls {polls && polls.length > 0 && `(${polls.length})`}
        </h2>
        {canManage && (
          <Button size="sm" variant="gradient" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Create Poll
          </Button>
        )}
      </div>

      {!polls || polls.length === 0 ? (
        <GlassCard variant="subtle" className="flex flex-col items-center py-12 text-center">
          <BarChart3 className="mb-3 size-8 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">No polls yet</p>
        </GlassCard>
      ) : (
        <>
          {active.length > 0 && (
            <motion.div
              className="space-y-3"
              variants={pollContainerVariants}
              initial="hidden"
              animate="visible"
            >
              <h3 className="text-xs font-semibold text-[var(--text-secondary)]">Active</h3>
              {active.map((poll) => (
                <motion.div key={poll.id} variants={pollItemVariants}>
                  <PollCard poll={poll} canManage={canManage} />
                </motion.div>
              ))}
            </motion.div>
          )}
          {closed.length > 0 && (
            <motion.div
              className="space-y-3"
              variants={pollContainerVariants}
              initial="hidden"
              animate="visible"
            >
              <h3 className="text-xs font-semibold text-[var(--text-secondary)]">Closed</h3>
              {closed.map((poll) => (
                <motion.div key={poll.id} variants={pollItemVariants}>
                  <PollCard poll={poll} canManage={canManage} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}

      <CreatePollModal groupId={groupId} open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
