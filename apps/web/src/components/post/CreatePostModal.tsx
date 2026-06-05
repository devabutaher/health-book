"use client";

import { useState, useRef } from "react";
import {
  CalendarClock,
  Clock,
  FileText,
  Hash,
  ImagePlus,
  Loader2,
  X,
  Plus,
  Trash2,
  BarChart3,
  HelpCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCreatePostMutation, uploadPostImage } from "@/redux/api/postApi";
import { useAppSelector } from "@/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CURATED_TAGS } from "@/lib/constants";
import { useSound } from "@/hooks/useSound";
import RecipeForm from "../health/RecipeForm";
import type { CreatePostPayload } from "@/types/post";

type TemplateMode = null | "BEFORE_AFTER" | "RECIPE" | "QUIZ" | "POLL";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  initialPost?: { id: string; content: string; privacy: string };
  groupId?: string;
}

export function CreatePostModal({
  open,
  onClose,
  onCreated,
  initialPost,
  groupId,
}: CreatePostModalProps) {
  const token = useAppSelector((s) => s.auth.accessToken);
  const [create, { isLoading }] = useCreatePostMutation();
  const { play } = useSound();
  const isEdit = !!initialPost;
  const [content, setContent] = useState("");
  const [templateMode, setTemplateMode] = useState<TemplateMode>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const draftRef = useRef(false);
  const postNowRef = useRef(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);

  const [recipeData, setRecipeData] = useState<Record<string, unknown> | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [privacy] = useState(initialPost?.privacy || "public");
  const [showTags, setShowTags] = useState(false);

  // Poll builder state
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>([""]);
  const [pollMultiChoice, setPollMultiChoice] = useState(false);

  // Quiz builder state
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState<string[]>([""]);
  const [quizCorrectIndex, setQuizCorrectIndex] = useState(0);

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    const remaining = 10 - files.length;
    const allowed = selected.slice(0, remaining);
    setFiles((prev) => [...prev, ...allowed]);
    setPreviews((prev) => [...prev, ...allowed.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !content.trim() &&
      files.length === 0 &&
      !recipeData &&
      templateMode !== "QUIZ" &&
      templateMode !== "POLL"
    )
      return;

    const isDraft = draftRef.current;
    const isPostNow = postNowRef.current;
    const isScheduled = !isPostNow && !!scheduledAt;
    draftRef.current = false;
    postNowRef.current = false;

    setUploading(true);
    const toastId = toast.loading("Uploading post...");
    try {
      const mediaUrls: string[] = [];
      for (const file of files) {
        const url = await uploadPostImage(file, token!);
        mediaUrls.push(url);
      }

      const payload: CreatePostPayload & { groupId?: string } = {
        content:
          content.trim() ||
          (recipeData
            ? "Shared a recipe"
            : templateMode === "QUIZ"
              ? "Shared a quiz"
              : templateMode === "POLL"
                ? "Shared a poll"
                : "Shared a health log"),
        privacy,
        mediaUrls,
      };

      if (groupId) payload.groupId = groupId;

      if (selectedTags.length > 0) {
        payload.content = payload.content + " " + selectedTags.map((t) => `#${t}`).join(" ");
      }

      if (templateMode === "QUIZ") {
        payload.templateType = "QUIZ";
        payload.templateData = {
          type: "quiz",
          question: quizQuestion,
          options: quizOptions.filter(Boolean),
          correctIndex: quizCorrectIndex,
        };
      } else if (templateMode === "POLL") {
        payload.poll = {
          question: pollQuestion,
          options: pollOptions.filter(Boolean),
          isMultipleChoice: pollMultiChoice,
        };
      } else if (templateMode) {
        payload.templateType = templateMode;
        if (templateMode === "RECIPE" && recipeData) {
          payload.templateData = recipeData;
        }
      }

      if (isScheduled) payload.isDraft = true;
      if (isDraft) payload.isDraft = true;
      if (!isPostNow && scheduledAt) payload.scheduledAt = new Date(scheduledAt).toISOString();

      play("post-publish");
      await create(payload).unwrap();
      toast.dismiss(toastId);
      toast.success(isScheduled ? "Post scheduled!" : isDraft ? "Draft saved!" : "Post shared!");
      resetForm();
      onCreated?.();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message || "Failed to create post";
      toast.dismiss(toastId);
      play("error");
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setContent("");
    setFiles([]);
    setPreviews([]);
    setRecipeData(null);
    setTemplateMode(null);
    setScheduledAt("");
    setShowSchedule(false);
    setSelectedTags([]);
    setShowTags(false);
    setPollQuestion("");
    setPollOptions([""]);
    setPollMultiChoice(false);
    setQuizQuestion("");
    setQuizOptions([""]);
    setQuizCorrectIndex(0);
  };

  const handleTemplateSelect = (mode: TemplateMode) => {
    setTemplateMode(mode);
    setFiles([]);
    setPreviews([]);
    if (mode !== "RECIPE") setRecipeData(null);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const isBusy = isLoading || uploading;
  const charLimit = 2000;
  const charsOverEighty = content.length > charLimit * 0.8;
  const charsAtLimit = content.length >= charLimit;

  const canSubmit =
    (templateMode === "QUIZ" && quizQuestion && quizOptions.filter(Boolean).length >= 2) ||
    (templateMode === "POLL" && pollQuestion && pollOptions.filter(Boolean).length >= 2) ||
    !!content.trim() ||
    files.length > 0 ||
    !!recipeData;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {isEdit ? "Edit post" : "Create post"}
          </DialogTitle>
          <DialogDescription>Share your health journey with the community.</DialogDescription>
        </DialogHeader>

        <div>
          <ToggleGroup
            type="single"
            value={templateMode ?? "TEXT"}
            onValueChange={(v) => handleTemplateSelect(v === "TEXT" ? null : (v as TemplateMode))}
            size="sm"
            className="justify-start flex-wrap gap-1"
          >
            <ToggleGroupItem value="TEXT">📝 Text</ToggleGroupItem>
            <ToggleGroupItem value="BEFORE_AFTER">📸 Before & After</ToggleGroupItem>
            <ToggleGroupItem value="RECIPE">🍳 Recipe</ToggleGroupItem>
            <ToggleGroupItem value="QUIZ">❓ Quiz</ToggleGroupItem>
            <ToggleGroupItem value="POLL">📊 Poll</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup className="gap-4">
            {templateMode === "BEFORE_AFTER" ? (
              <>
                <Field>
                  <FieldLabel htmlFor="content" className="sr-only">
                    Story
                  </FieldLabel>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your transformation story..."
                    className="min-h-[80px]"
                    maxLength={charLimit}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {i === 0 ? "Before" : "After"}
                      </p>
                      {previews[i] ? (
                        <div className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--glass-border)]">
                          {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL preview */}
                          <img src={previews[i]} alt="" className="size-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90"
                            aria-label="Remove"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => inputRef.current?.click()}
                          className="flex aspect-square min-h-[44px] items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-default)] text-sm text-muted-foreground transition-colors hover:border-brand-teal/50 hover:bg-[var(--bg-overlay)]"
                        >
                          + Add {i === 0 ? "Before" : "After"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : templateMode === "RECIPE" ? (
              <RecipeForm
                data={recipeData}
                onChange={setRecipeData}
                onContentChange={setContent}
                content={content}
              />
            ) : templateMode === "QUIZ" ? (
              <div className="space-y-3 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-overlay)] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <HelpCircle className="size-4" /> Quiz
                </div>
                <input
                  type="text"
                  value={quizQuestion}
                  onChange={(e) => setQuizQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-sm outline-none focus:border-brand-teal/50"
                  maxLength={500}
                />
                {quizOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="quiz-correct"
                      checked={quizCorrectIndex === idx}
                      onChange={() => setQuizCorrectIndex(idx)}
                      className="shrink-0 accent-brand-teal"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...quizOptions];
                        next[idx] = e.target.value;
                        setQuizOptions(next);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-sm outline-none focus:border-brand-teal/50"
                      maxLength={200}
                    />
                    {quizOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = quizOptions.filter((_, i) => i !== idx);
                          setQuizOptions(next);
                          if (quizCorrectIndex >= next.length) setQuizCorrectIndex(next.length - 1);
                        }}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {quizOptions.length < 10 && (
                  <button
                    type="button"
                    onClick={() => setQuizOptions([...quizOptions, ""])}
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
            ) : templateMode === "POLL" ? (
              <div className="space-y-3 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-overlay)] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <BarChart3 className="size-4" /> Poll
                </div>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-sm outline-none focus:border-brand-teal/50"
                  maxLength={500}
                />
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...pollOptions];
                        next[idx] = e.target.value;
                        setPollOptions(next);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-sm outline-none focus:border-brand-teal/50"
                      maxLength={200}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 10 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions([...pollOptions, ""])}
                    className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--border-default)] py-2 text-xs text-[var(--text-muted)] transition-colors hover:border-brand-teal/50 hover:text-brand-teal"
                  >
                    <Plus className="size-3.5" />
                    Add option
                  </button>
                )}
                <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <input
                    type="checkbox"
                    checked={pollMultiChoice}
                    onChange={(e) => setPollMultiChoice(e.target.checked)}
                    className="rounded accent-brand-teal"
                  />
                  Allow multiple choices
                </label>
              </div>
            ) : (
              <Field>
                <FieldLabel htmlFor="content" className="sr-only">
                  What&apos;s on your mind?
                </FieldLabel>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your health journey..."
                  className="min-h-[80px]"
                  maxLength={charLimit}
                  autoFocus
                />
                <FieldDescription
                  className={cn(
                    "text-right text-xs",
                    charsAtLimit
                      ? "text-destructive"
                      : charsOverEighty
                        ? "text-brand-amber"
                        : "text-muted-foreground",
                  )}
                >
                  {content.length}/{charLimit}
                </FieldDescription>
              </Field>
            )}

            {templateMode !== "BEFORE_AFTER" &&
              templateMode !== "RECIPE" &&
              templateMode !== "QUIZ" &&
              templateMode !== "POLL" &&
              previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((src, i) => (
                    <div
                      key={i}
                      className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--glass-border)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL preview */}
                      <img src={src} alt="" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute right-1 top-1 flex size-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90"
                        aria-label="Remove"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </FieldGroup>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-teal to-brand-green px-2 py-0.5 text-[10px] font-medium text-white transition-opacity hover:opacity-80"
                >
                  #{tag}
                  <span className="text-white/70">✕</span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowTags(!showTags)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border border-[var(--glass-border)] px-3 py-1.5 text-xs transition-colors",
              selectedTags.length > 0
                ? "bg-brand-teal/5 border-brand-teal/20"
                : "hover:bg-[var(--bg-overlay)] hover:border-brand-teal/30",
            )}
          >
            <div className="flex items-center gap-2">
              <Hash className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">
                {selectedTags.length > 0 ? `Tags (${selectedTags.length})` : "Add tags"}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {selectedTags.length > 0 && (
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTags([]);
                  }}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </span>
              )}
              <span className="text-muted-foreground text-base">{showTags ? "▴" : "▸"}</span>
            </div>
          </button>

          {showTags && templateMode !== "RECIPE" && (
            <div className="flex flex-wrap gap-1">
              {CURATED_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium transition-all",
                      active
                        ? "bg-gradient-to-r from-brand-teal to-brand-green text-white"
                        : "border border-[var(--glass-border)] bg-[var(--bg-overlay)] text-muted-foreground hover:border-brand-teal/40 hover:text-brand-teal",
                    )}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {templateMode !== "BEFORE_AFTER" &&
            templateMode !== "RECIPE" &&
            templateMode !== "QUIZ" &&
            templateMode !== "POLL" &&
            previews.length === 0 ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={files.length >= 10}
                className="flex min-h-[120px] w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-default)] transition-colors hover:border-brand-teal/50 hover:bg-[var(--bg-overlay)]"
              >
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <ImagePlus className="size-8" />
                  <span className="text-sm font-medium">Click to upload images</span>
                  <span className="text-xs">Up to 10 images</span>
                </div>
              </button>
            ) : null}
            {templateMode !== "BEFORE_AFTER" &&
            templateMode !== "RECIPE" &&
            templateMode !== "QUIZ" &&
            templateMode !== "POLL" &&
            previews.length > 0 ? (
              <div className="flex items-center justify-between rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-overlay)] px-4 py-2.5">
                <span className="text-sm text-muted-foreground">
                  {files.length} image{files.length > 1 ? "s" : ""} selected
                </span>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-sm font-medium text-brand-teal hover:underline"
                >
                  Add more
                </button>
              </div>
            ) : null}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            {showSchedule ? (
              <div className="flex items-center gap-2 rounded-lg border border-[var(--glass-border)] bg-[var(--bg-overlay)] p-3">
                <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none [color-scheme:dark]"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setScheduledAt("");
                    setShowSchedule(false);
                  }}
                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  {scheduledAt ? "Clear" : "Cancel"}
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant={scheduledAt ? "default" : "outline"}
                onClick={() => setShowSchedule(true)}
                className="gap-2"
              >
                <Clock className="size-4" />
                {scheduledAt
                  ? `Scheduled: ${new Date(scheduledAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                  : "Schedule post"}
              </Button>
            )}
            <Button
              type="submit"
              variant="outline"
              disabled={isBusy || !canSubmit}
              onClick={() => (draftRef.current = true)}
              className="gap-2"
            >
              <FileText className="size-4" />
              Save as Draft
            </Button>
            {scheduledAt ? (
              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isBusy || !canSubmit}
                  onClick={() => (postNowRef.current = true)}
                  className="flex-1 gap-2"
                >
                  Post Now →
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={isBusy || !canSubmit}
                  className="flex-[2]"
                >
                  {isBusy && <Loader2 className="animate-spin" />}
                  {uploading ? "Uploading..." : isLoading ? "Submitting..." : "Schedule Post"}
                </Button>
              </div>
            ) : (
              <Button
                type="submit"
                variant="gradient"
                disabled={isBusy || !canSubmit}
                onClick={() => (postNowRef.current = true)}
              >
                {isBusy && <Loader2 className="animate-spin" />}
                {uploading ? "Uploading..." : isLoading ? "Posting..." : isEdit ? "Save" : "Post"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
