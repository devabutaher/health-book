"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useCreatePollMutation } from "@/redux/api/groupPollApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { scaleIn } from "@/lib/motion/variants";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/getErrorMessage";

export function CreatePollModal({
  groupId,
  open,
  onClose,
}: {
  groupId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [expiresIn, setExpiresIn] = useState("");
  const [createPoll, { isLoading }] = useCreatePollMutation();

  const addOption = () => {
    if (options.length >= 10) return;
    setOptions([...options, ""]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, value: string) => {
    const next = [...options];
    next[idx] = value;
    setOptions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filled = options.filter((o) => o.trim());
    if (!question.trim() || filled.length < 2) return;

    try {
      const expiresAt = expiresIn
        ? new Date(Date.now() + Number(expiresIn) * 3600000).toISOString()
        : undefined;

      await createPoll({
        groupId,
        question: question.trim(),
        options: filled.map((o) => o.trim()),
        isMultipleChoice: isMultipleChoice || undefined,
        expiresAt,
      }).unwrap();
      toast.success("Poll created!");
      onClose();
      setQuestion("");
      setOptions(["", ""]);
      setIsMultipleChoice(false);
      setExpiresIn("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create poll"));
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
            className="relative w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-lg)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                Create Poll
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
                  Question
                </label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What do you want to ask?"
                  maxLength={500}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  Options ({options.length}/10)
                </label>
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={opt}
                        onChange={(e) => updateOption(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        maxLength={200}
                        className="flex-1"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="flex size-8 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-overlay)] hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < 10 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="mt-2 flex items-center gap-1 text-xs font-semibold text-brand-teal transition-colors hover:text-brand-green"
                  >
                    <Plus className="size-3" />
                    Add option
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isMultipleChoice}
                    onChange={(e) => setIsMultipleChoice(e.target.checked)}
                    className="size-4 rounded border-[var(--border-default)] text-brand-teal focus:ring-brand-teal/30"
                  />
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">
                    Allow multiple choices
                  </span>
                </label>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  Expires in (hours, optional)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  placeholder="e.g. 24"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={
                    !question.trim() || options.filter((o) => o.trim()).length < 2 || isLoading
                  }
                  className="flex-1"
                >
                  {isLoading ? "Creating..." : "Create Poll"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
