"use client";

import { useState } from "react";
import {
  X,
  Target,
  Users,
  Trophy,
  Sparkles,
  Dumbbell,
  Brain,
  Moon,
  Apple,
  Plus,
  Trash2,
  Swords,
} from "lucide-react";
import { useUpdateChallengeMutation } from "@/redux/api/challengesApi";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { scaleIn } from "@/lib/motion/variants";
import { toast } from "sonner";
import type { Challenge, ChallengeMilestone, ChallengeDifficulty } from "@/types/challenge";
import { cn } from "@/lib/utils";

const types = [
  { value: "SOLO", label: "Solo", icon: Target, desc: "Personal goal, just you" },
  { value: "GROUP", label: "Group", icon: Users, desc: "Compete with a group" },
  { value: "PLATFORM", label: "Platform", icon: Trophy, desc: "Open to everyone" },
  { value: "DUEL", label: "Duel", icon: Swords, desc: "Head-to-head" },
] as const;

const difficulties: { value: ChallengeDifficulty; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const categories = [
  { value: "GENERAL", label: "General", icon: Sparkles },
  { value: "FITNESS", label: "Fitness", icon: Dumbbell },
  { value: "NUTRITION", label: "Nutrition", icon: Apple },
  { value: "MENTAL_HEALTH", label: "Mental", icon: Brain },
  { value: "SLEEP", label: "Sleep", icon: Moon },
] as const;

export function EditChallengeModal({
  challenge,
  onClose,
}: {
  challenge: Challenge;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(challenge.title);
  const [description, setDescription] = useState(challenge.description);
  const [type, setType] = useState<string>(challenge.type);
  const [category, setCategory] = useState(challenge.category || "GENERAL");
  const [difficulty, setDifficulty] = useState(challenge.difficulty || "BEGINNER");
  const [dayCount, setDayCount] = useState(challenge.dayCount ? String(challenge.dayCount) : "");
  const [startDate, setStartDate] = useState(
    new Date(challenge.startDate).toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(new Date(challenge.endDate).toISOString().split("T")[0]);
  const [prize, setPrize] = useState(challenge.prize || "");
  const [entryFee, setEntryFee] = useState(challenge.entryFee ? String(challenge.entryFee) : "");
  const [goalTarget, setGoalTarget] = useState(
    challenge.goalTarget ? String(challenge.goalTarget) : "",
  );
  const [goalUnit, setGoalUnit] = useState(challenge.goalUnit || "");
  const [milestones, setMilestones] = useState<ChallengeMilestone[]>(
    challenge.milestones?.length
      ? challenge.milestones
      : [
          { name: "Bronze", threshold: 25, icon: "🥉" },
          { name: "Silver", threshold: 50, icon: "🥈" },
          { name: "Gold", threshold: 75, icon: "🥇" },
        ],
  );
  const [updateChallenge, { isLoading }] = useUpdateChallengeMutation();

  const handleMilestoneChange = (
    index: number,
    field: keyof ChallengeMilestone,
    value: string | number,
  ) => {
    setMilestones((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const addMilestone = () => {
    setMilestones((prev) => [...prev, { name: "", threshold: 0, icon: "🏅" }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !startDate || !endDate) return;

    try {
      await updateChallenge({
        id: challenge.id,
        title: title.trim(),
        description: description.trim(),
        type,
        category,
        difficulty: difficulty as ChallengeDifficulty,
        dayCount: dayCount ? Number(dayCount) : undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        prize: prize.trim() || null,
        entryFee: entryFee ? Number(entryFee) : null,
        goalTarget: goalTarget ? Number(goalTarget) : null,
        goalUnit: goalUnit.trim() || null,
        milestones,
      }).unwrap();
      toast.success("Challenge updated!");
      onClose();
    } catch {
      toast.error("Failed to update challenge");
    }
  };

  return (
    <AnimatePresence>
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
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-lg)]"
          data-custom-modal
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
              Edit Challenge
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
                placeholder="e.g. 30-Day Plank Challenge"
                maxLength={200}
                required
                className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rules, goals, and details..."
                rows={3}
                maxLength={2000}
                className="w-full resize-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {types.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setType(t.value)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-xl p-3 text-xs transition-all",
                          type === t.value
                            ? "bg-gradient-to-br from-brand-teal/20 to-brand-green/20 border border-brand-teal/30"
                            : "bg-[var(--bg-subtle)] border border-transparent hover:bg-[var(--bg-overlay)]",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-5",
                            type === t.value ? "text-brand-teal" : "text-[var(--text-muted)]",
                          )}
                        />
                        <span
                          className={cn(
                            "font-semibold",
                            type === t.value ? "text-brand-teal" : "text-[var(--text-secondary)]",
                          )}
                        >
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-xl p-2.5 text-xs transition-all",
                          category === cat.value
                            ? "bg-gradient-to-br from-brand-teal/20 to-brand-green/20 border border-brand-teal/30"
                            : "bg-[var(--bg-subtle)] border border-transparent hover:bg-[var(--bg-overlay)]",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-4",
                            category === cat.value ? "text-brand-teal" : "text-[var(--text-muted)]",
                          )}
                        />
                        <span
                          className={cn(
                            "font-semibold",
                            category === cat.value
                              ? "text-brand-teal"
                              : "text-[var(--text-secondary)]",
                          )}
                        >
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                Difficulty
              </label>
              <div className="flex gap-2">
                {difficulties.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDifficulty(d.value)}
                    className={cn(
                      "flex-1 rounded-xl py-2 text-xs font-semibold transition-all",
                      difficulty === d.value
                        ? "bg-gradient-to-r from-brand-teal to-brand-green text-white"
                        : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]",
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  Day Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={dayCount}
                  onChange={(e) => setDayCount(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
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
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  Goal Unit
                </label>
                <input
                  value={goalUnit}
                  onChange={(e) => setGoalUnit(e.target.value)}
                  placeholder="e.g. km, minutes"
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  Prize (optional)
                </label>
                <input
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  placeholder="e.g. 1 month premium"
                  maxLength={200}
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  Entry Fee ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                />
              </div>
            </div>

            {/* Milestones */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Milestones
                </label>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="flex items-center gap-1 text-xs text-brand-teal hover:underline"
                >
                  <Plus className="size-3" /> Add
                </button>
              </div>
              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={m.icon}
                      onChange={(e) => handleMilestoneChange(i, "icon", e.target.value)}
                      placeholder="🥉"
                      maxLength={2}
                      className="w-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] px-2 py-1.5 text-center text-xs"
                    />
                    <input
                      value={m.name}
                      onChange={(e) => handleMilestoneChange(i, "name", e.target.value)}
                      placeholder="Name"
                      className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    />
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={m.threshold}
                      onChange={(e) =>
                        handleMilestoneChange(i, "threshold", Number(e.target.value))
                      }
                      placeholder="%"
                      className="w-16 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] px-2 py-1.5 text-xs text-[var(--text-primary)] text-center"
                    />
                    <span className="text-[10px] text-[var(--text-muted)]">%</span>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(i)}
                        className="text-[var(--text-muted)] hover:text-red-500"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={
                  !title.trim() || !description.trim() || !startDate || !endDate || isLoading
                }
                className="flex-1"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
