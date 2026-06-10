"use client";

import { useState, forwardRef, useImperativeHandle, memo } from "react";
import { BarChart3, Plus, Trash2 } from "lucide-react";

export interface PollData {
  question: string;
  options: string[];
  isMultipleChoice: boolean;
}

export interface PollEditorHandle {
  getData(): PollData;
  reset(): void;
}

export const PollEditor = memo(
  forwardRef<PollEditorHandle, object>(function PollEditor(_props, ref) {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState<string[]>([""]);
    const [isMultipleChoice, setIsMultipleChoice] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        getData: () => ({ question, options: options.filter(Boolean), isMultipleChoice }),
        reset: () => {
          setQuestion("");
          setOptions([""]);
          setIsMultipleChoice(false);
        },
      }),
      [question, options, isMultipleChoice],
    );

    return (
      <div className="space-y-3 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-overlay)] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <BarChart3 className="size-4" /> Poll
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
                onClick={() => setOptions((prev) => prev.filter((_, i) => i !== idx))}
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
        <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <input
            type="checkbox"
            checked={isMultipleChoice}
            onChange={(e) => setIsMultipleChoice(e.target.checked)}
            className="rounded accent-brand-teal"
          />
          Allow multiple choices
        </label>
      </div>
    );
  }),
);
