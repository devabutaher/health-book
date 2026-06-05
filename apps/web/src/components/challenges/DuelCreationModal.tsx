"use client";

import { useState } from "react";
import { X, Swords } from "lucide-react";
import { useCreateDuelMutation } from "@/redux/api/challengesApi";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { scaleIn } from "@/lib/motion/variants";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSound } from "@/hooks/useSound";

export function DuelCreationModal({
  open,
  onClose,
  targetUserId,
  targetName,
}: {
  open: boolean;
  onClose: () => void;
  targetUserId: string;
  targetName: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(`Duel with ${targetName}`);
  const [description, setDescription] = useState("");
  const [dayCount, setDayCount] = useState("7");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalUnit, setGoalUnit] = useState("");
  const [createDuel, { isLoading }] = useCreateDuelMutation();
  const { play } = useSound();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + (Number(dayCount) || 7));

    try {
      const result = await createDuel({
        title: title.trim(),
        description: description.trim() || undefined,
        targetUserId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        goalTarget: goalTarget ? Number(goalTarget) : undefined,
        goalUnit: goalUnit.trim() || undefined,
        dayCount: Number(dayCount) || 7,
      }).unwrap();
      play("success");
      toast.success(`Duel challenge created!`);
      const challengeId =
        (result as { data?: { id: string } })?.data?.id || (result as { id?: string })?.id;
      onClose();
      if (challengeId) router.push(`/challenges/${challengeId}`);
    } catch {
      play("error");
      toast.error("Failed to create duel");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-sm rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-lg)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                <Swords className="mr-1.5 inline size-4 text-brand-coral" />
                Challenge {targetName}
              </h2>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Duel title"
                  maxLength={200}
                  required
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Rules and details..."
                  rows={2}
                  maxLength={2000}
                  className="w-full resize-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dayCount}
                    onChange={(e) => setDayCount(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    Goal Target
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  Goal Unit
                </label>
                <input
                  value={goalUnit}
                  onChange={(e) => setGoalUnit(e.target.value)}
                  placeholder="e.g. km, reps, minutes"
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={!title.trim() || isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Creating..." : "Challenge!"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
