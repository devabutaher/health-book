"use client";

import { useState, forwardRef, useImperativeHandle, memo, useCallback } from "react";
import { HelpCircle, Plus, Trash2 } from "lucide-react";

export interface QuizData {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface QuizEditorHandle {
  getData(): QuizData;
  reset(): void;
}

interface QuizEditorProps {
  initialData?: QuizData;
}

export const QuizEditor = memo(
  forwardRef<QuizEditorHandle, QuizEditorProps>(function QuizEditor({ initialData }, ref) {
    const [question, setQuestion] = useState(initialData?.question ?? "");
    const [options, setOptions] = useState<string[]>(initialData?.options ?? [""]);
    const [correctIndex, setCorrectIndex] = useState(initialData?.correctIndex ?? 0);

    useImperativeHandle(
      ref,
      () => ({
        getData: () => ({ question, options: options.filter(Boolean), correctIndex }),
        reset: () => {
          setQuestion("");
          setOptions([""]);
          setCorrectIndex(0);
        },
      }),
      [question, options, correctIndex],
    );

    const removeOption = useCallback((idx: number) => {
      setOptions((prev) => {
        const next = prev.filter((_, i) => i !== idx);
        setCorrectIndex((ci) => (ci >= next.length ? Math.max(0, next.length - 1) : ci));
        return next;
      });
    }, []);

    return (
      <div className="space-y-3 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-overlay)] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <HelpCircle className="size-4" /> Quiz
        </div>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-sm outline-none focus:border-brand-teal/50"
          maxLength={500}
        />
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="radio"
              name="quiz-correct"
              checked={correctIndex === idx}
              onChange={() => setCorrectIndex(idx)}
              className="shrink-0 accent-brand-teal"
            />
            <input
              type="text"
              value={opt}
              onChange={(e) => {
                setOptions((prev) => {
                  const next = [...prev];
                  next[idx] = e.target.value;
                  return next;
                });
              }}
              placeholder={`Option ${idx + 1}`}
              className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-sm outline-none focus:border-brand-teal/50"
              maxLength={200}
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(idx)}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        ))}
        {options.length < 10 && (
          <button
            type="button"
            onClick={() => setOptions((prev) => [...prev, ""])}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--border-default)] py-2 text-xs text-[var(--text-muted)] transition-colors hover:border-brand-teal/50 hover:text-brand-teal"
          >
            <Plus className="size-3.5" />
            Add option
          </button>
        )}
        <p className="text-[10px] text-[var(--text-muted)]">
          Select the correct answer with the radio button
        </p>
      </div>
    );
  }),
);
