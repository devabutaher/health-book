"use client";

import { useState, useMemo } from "react";
import { X, LayoutTemplate, Swords, Users as UsersIcon, Target, Trophy } from "lucide-react";
import {
  useCreateChallengeMutation,
  useGetChallengeTemplatesQuery,
} from "@/redux/api/challengesApi";
import { useBrowseGroupsQuery } from "@/redux/api/groupsApi";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { scaleIn } from "@/lib/motion/variants";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { ChallengeCategory, ChallengeDifficulty } from "@/types/challenge";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";

const difficulties: { value: ChallengeDifficulty; label: string; class: string }[] = [
  { value: "BEGINNER", label: "Beginner", class: "text-green-500" },
  { value: "INTERMEDIATE", label: "Intermediate", class: "text-amber-500" },
  { value: "ADVANCED", label: "Advanced", class: "text-red-500" },
];

const defaultMilestones = [
  { name: "Bronze", threshold: 25, icon: "🥉" },
  { name: "Silver", threshold: 50, icon: "🥈" },
  { name: "Gold", threshold: 75, icon: "🥇" },
];

export function CreateChallengeModal({
  open,
  onClose,
  showTemplates,
  onCloseTemplates,
}: {
  open: boolean;
  onClose: () => void;
  showTemplates?: boolean;
  onCloseTemplates?: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"SOLO" | "GROUP" | "PLATFORM" | "DUEL">("SOLO");
  const [category, setCategory] = useState<ChallengeCategory>("GENERAL");
  const [difficulty, setDifficulty] = useState<ChallengeDifficulty>("BEGINNER");
  const [groupId, setGroupId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [prize, setPrize] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalUnit, setGoalUnit] = useState("");
  const [createChallenge, { isLoading }] = useCreateChallengeMutation();

  const computedDayCount = useMemo(() => {
    if (!startDate || !endDate) return 30;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
    return Math.max(1, diff);
  }, [startDate, endDate]);
  const { data: groupsData } = useBrowseGroupsQuery({}, { skip: type !== "GROUP" });
  const { data: templates, isLoading: templatesLoading } = useGetChallengeTemplatesQuery({});
  const { play } = useSound();
  const [view, setView] = useState<"create" | "templates">(showTemplates ? "templates" : "create");

  const officialTemplates = (templates || []).filter((t) => t.isOfficial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !startDate || !endDate) return;

    try {
      const result = await createChallenge({
        title: title.trim(),
        description: description.trim(),
        type,
        category: category !== "GENERAL" ? category : undefined,
        difficulty,
        dayCount: computedDayCount,
        ...(type === "GROUP" && groupId ? { groupId } : {}),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        prize: prize.trim() || undefined,
        entryFee: entryFee ? Number(entryFee) : undefined,
        goalTarget: goalTarget ? Number(goalTarget) : undefined,
        goalUnit: goalUnit.trim() || undefined,
        milestones: defaultMilestones,
      }).unwrap();
      play("success");
      toast.success("Challenge created!");
      onClose();
      const challengeId = (result as { data?: { id: string } }).data?.id;
      if (challengeId) router.push(`/challenges/${challengeId}`);
      resetForm();
    } catch {
      play("error");
      toast.error("Failed to create challenge");
    }
  };

  const handleTemplateSelect = async (template: (typeof officialTemplates)[number]) => {
    const end = new Date();
    end.setDate(end.getDate() + template.duration);
    const startStr = new Date().toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    try {
      const result = await createChallenge({
        title: template.title,
        description: template.description,
        type: template.type,
        category: template.category || "GENERAL",
        difficulty:
          template.duration >= 21
            ? "ADVANCED"
            : template.duration >= 14
              ? "INTERMEDIATE"
              : "BEGINNER",
        dayCount: template.duration,
        startDate: new Date(startStr).toISOString(),
        endDate: new Date(endStr).toISOString(),
        goalTarget: template.goalTarget || undefined,
        goalUnit: template.goalUnit || undefined,
        milestones: template.milestones || defaultMilestones,
        templateId: template.id,
      }).unwrap();
      play("success");
      toast.success(`"${template.title}" created!`);
      const challengeId = (result as { data?: { id: string } }).data?.id;
      onClose();
      onCloseTemplates?.();
      if (challengeId) router.push(`/challenges/${challengeId}`);
    } catch {
      play("error");
      toast.error("Failed to create from template");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("SOLO");
    setCategory("GENERAL");
    setDifficulty("BEGINNER");
    setGroupId("");
    setStartDate("");
    setEndDate("");
    setPrize("");
    setEntryFee("");
    setGoalTarget("");
    setGoalUnit("");
  };

  const handleClose = () => {
    onClose();
    onCloseTemplates?.();
    resetForm();
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
            onClick={handleClose}
          />
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-lg)]"
            data-custom-modal
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                {view === "templates" ? (
                  <>
                    <LayoutTemplate className="mr-1.5 inline size-4 text-brand-teal" /> Challenge
                    Templates
                  </>
                ) : (
                  "Create Challenge"
                )}
              </h2>
              <div className="flex items-center gap-2">
                {view === "create" ? (
                  <button
                    onClick={() => setView("templates")}
                    className="text-xs font-semibold text-brand-teal hover:underline"
                  >
                    Browse Templates
                  </button>
                ) : (
                  <button
                    onClick={() => setView("create")}
                    className="text-xs font-semibold text-brand-teal hover:underline"
                  >
                    Custom Create
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="flex size-8 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {view === "templates" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {officialTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTemplateSelect(t)}
                    className="group rounded-2xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-left transition-all hover:border-brand-teal/30 hover:bg-[var(--bg-elevated)] hover:shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-sm font-bold text-[var(--text-primary)]">
                        {t.title}
                      </h3>
                      {t.isOfficial && (
                        <span className="shrink-0 rounded-full bg-brand-teal/10 px-2 py-0.5 text-[10px] font-semibold text-brand-teal">
                          Official
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">
                      {t.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[var(--text-muted)]">
                      <span className="rounded-md bg-[var(--bg-overlay)] px-2 py-0.5">
                        {t.duration} days
                      </span>
                      {t.goalTarget && (
                        <span className="rounded-md bg-[var(--bg-overlay)] px-2 py-0.5">
                          {t.goalTarget} {t.goalUnit}
                        </span>
                      )}
                      {t.category && (
                        <span className="rounded-md bg-[var(--bg-overlay)] px-2 py-0.5">
                          {t.category.replace("_", " ")}
                        </span>
                      )}
                    </div>
                    {t.timesUsed > 0 && (
                      <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                        Used {t.timesUsed} times
                      </p>
                    )}
                  </button>
                ))}
                {templatesLoading ? (
                  <p className="col-span-2 py-8 text-center text-xs text-[var(--text-muted)]">
                    Loading templates...
                  </p>
                ) : (
                  officialTemplates.length === 0 && (
                    <p className="col-span-2 py-8 text-center text-xs text-[var(--text-muted)]">
                      No templates available
                    </p>
                  )
                )}
              </div>
            ) : (
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

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    Challenge Type
                  </label>
                  <div className="flex gap-2">
                    {[
                      {
                        value: "SOLO" as const,
                        label: "Solo",
                        icon: Target,
                        class: "bg-brand-blue/10 text-brand-blue",
                      },
                      {
                        value: "GROUP" as const,
                        label: "Group",
                        icon: UsersIcon,
                        class: "bg-brand-teal/10 text-brand-teal",
                      },
                      {
                        value: "PLATFORM" as const,
                        label: "Platform",
                        icon: Trophy,
                        class: "bg-brand-amber/10 text-brand-amber",
                      },
                      {
                        value: "DUEL" as const,
                        label: "Duel",
                        icon: Swords,
                        class: "bg-brand-coral/10 text-brand-coral",
                      },
                    ].map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setType(t.value)}
                          className={cn(
                            "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all",
                            type === t.value
                              ? `${t.class} ring-2 ring-inset ring-current`
                              : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]",
                          )}
                        >
                          <Icon className="size-3.5" />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {type === "GROUP" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                      Group
                    </label>
                    <select
                      value={groupId}
                      onChange={(e) => setGroupId(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                    >
                      <option value="">Select a group...</option>
                      {(groupsData?.groups || []).map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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
                      Day Count <span className="text-brand-teal">(auto)</span>
                    </label>
                    <div className="flex h-[42px] items-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-overlay)] px-4 text-sm text-[var(--text-primary)]">
                      {startDate && endDate ? `${computedDayCount} days` : "Set dates above"}
                    </div>
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
                      placeholder="e.g. km, minutes, sessions"
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

                <div className="rounded-xl bg-gradient-to-br from-brand-teal/[0.07] to-brand-green/[0.05] p-3">
                  <p className="text-[10px] font-semibold text-[var(--text-secondary)]">
                    🏆 Milestones will be auto-configured: Bronze (25%), Silver (50%), Gold (75%)
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClose}
                    className="flex-1"
                  >
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
                    {isLoading ? "Creating..." : "Create Challenge"}
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
