"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useAnswerQuizMutation, useGetQuizResultsQuery } from "@/redux/api/postQuizApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PostQuizCardProps {
  postId: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export function PostQuizCard({ postId, question, options, correctIndex }: PostQuizCardProps) {
  const [answer, { isLoading }] = useAnswerQuizMutation();
  const [answered, setAnswered] = useState<{ selectedIndex: number; isCorrect: boolean } | null>(
    null,
  );
  const { data: results } = useGetQuizResultsQuery(postId, { skip: !answered });

  const handleAnswer = async (selectedIndex: number) => {
    try {
      const res = await answer({ postId, selectedIndex }).unwrap();
      setAnswered({ selectedIndex, isCorrect: res.isCorrect });
      toast.success(res.isCorrect ? "Correct!" : "Wrong answer");
    } catch {
      toast.error("Failed to submit answer");
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-3">
      <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{question}</p>

      <div className="space-y-2">
        {options.map((option, idx) => {
          const isSelected = answered?.selectedIndex === idx;
          const isCorrectAnswer = answered && correctIndex === idx;
          const showResult = answered !== null;

          let stateClass =
            "bg-[var(--bg-overlay)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]";
          if (showResult) {
            if (isCorrectAnswer) {
              stateClass =
                "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-[var(--text-primary)] ring-1 ring-green-500/40";
            } else if (isSelected) {
              stateClass =
                "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-[var(--text-primary)] ring-1 ring-red-500/40";
            } else {
              stateClass = "bg-[var(--bg-overlay)] text-[var(--text-muted)]";
            }
          }

          return (
            <motion.button
              key={idx}
              whileTap={!showResult ? { scale: 0.98 } : undefined}
              onClick={() => !showResult && handleAnswer(idx)}
              disabled={showResult || isLoading}
              className={cn(
                "relative w-full overflow-hidden rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                stateClass,
                showResult && "cursor-default",
              )}
            >
              <span className="relative z-10 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  {showResult && isCorrectAnswer && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <Check className="size-3.5 text-green-500" />
                    </motion.span>
                  )}
                  {showResult && isSelected && !isCorrectAnswer && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <X className="size-3.5 text-red-500" />
                    </motion.span>
                  )}
                  {option}
                </span>
                {results && (
                  <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                    {results.optionCounts.find((o) => o.optionIndex === idx)?._count ?? 0}
                  </span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      {results && (
        <p className="mt-2 text-[10px] text-[var(--text-muted)]">
          {results.totalAnswers} answer{results.totalAnswers !== 1 ? "s" : ""} &middot;{" "}
          {Math.round((results.correctCount / results.totalAnswers) * 100)}% correct
        </p>
      )}
    </div>
  );
}
