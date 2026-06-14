"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/hooks";
import { useSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/getErrorMessage";
import {
  uploadPostImage,
  useCreatePostMutation,
  useGetPostQuery,
  useUpdatePostMutation,
} from "@/redux/api/postApi";
import type { CreatePostPayload, Post } from "@/types/post";
import {
  BarChart3,
  CalendarClock,
  Clock,
  FileText,
  Globe,
  HelpCircle,
  ImagePlus,
  Loader2,
  Lock,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import RecipeForm from "../health/RecipeForm";
import type { ContentEditorHandle } from "./ContentEditor";
import { ContentEditor } from "./ContentEditor";
import type { MediaUploaderHandle } from "./MediaUploader";
import { MediaUploader } from "./MediaUploader";
import type { PollEditorHandle } from "./PollEditor";
import { PollEditor } from "./PollEditor";
import type { QuizEditorHandle } from "./QuizEditor";
import { QuizEditor } from "./QuizEditor";
import type { TagPickerHandle } from "./TagPicker";
import { TagPicker } from "./TagPicker";

type TemplateMode = null | "BEFORE_AFTER" | "RECIPE" | "QUIZ" | "POLL";

const TEMPLATES: { value: TemplateMode; label: string; icon: typeof FileText }[] = [
  { value: null, label: "Post", icon: FileText },
  { value: "BEFORE_AFTER", label: "Before & After", icon: ImagePlus },
  { value: "RECIPE", label: "Recipe", icon: UtensilsCrossed },
  { value: "QUIZ", label: "Quiz", icon: HelpCircle },
  { value: "POLL", label: "Poll", icon: BarChart3 },
];

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  initialPost?: Post;
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
  const [create] = useCreatePostMutation();
  const [updatePost] = useUpdatePostMutation();
  const { play } = useSound();
  const isEdit = !!initialPost;
  const { data: fetchedPost, isLoading: postLoading } = useGetPostQuery(initialPost?.id ?? "", {
    skip: !isEdit,
  });
  const fullPost = initialPost ?? (fetchedPost?.data as Post | undefined) ?? null;
  const [templateMode, setTemplateMode] = useState<TemplateMode>(
    () => (fullPost?.templateType as TemplateMode) || null,
  );
  const [privacy, setPrivacy] = useState<"PUBLIC" | "FRIENDS" | "PRIVATE">(
    () => (fullPost?.privacy as "PUBLIC" | "FRIENDS" | "PRIVATE") || "PUBLIC",
  );
  const [recipeData, setRecipeData] = useState<Record<string, unknown> | null>(() =>
    fullPost?.templateType === "RECIPE" && fullPost?.templateData ? fullPost.templateData : null,
  );
  const [recipeContent, setRecipeContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState(() =>
    fullPost?.scheduledAt ? new Date(fullPost.scheduledAt).toISOString().slice(0, 16) : "",
  );
  const [showSchedule, setShowSchedule] = useState(() => !!fullPost?.scheduledAt);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contentRef = useRef<ContentEditorHandle>(null);
  const mediaRef = useRef<MediaUploaderHandle>(null);
  const tagsRef = useRef<TagPickerHandle>(null);
  const quizRef = useRef<QuizEditorHandle>(null);
  const pollRef = useRef<PollEditorHandle>(null);

  const formRef = useRef<HTMLFormElement>(null);

  const draftRef = useRef(false);
  const postNowRef = useRef(false);

  const resetAll = useCallback(() => {
    contentRef.current?.reset();
    mediaRef.current?.reset();
    tagsRef.current?.reset();
    quizRef.current?.reset();
    pollRef.current?.reset();
    setRecipeData(null);
    setRecipeContent("");
    setTemplateMode(null);
    setScheduledAt("");
    setShowSchedule(false);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      const content =
        templateMode === "RECIPE"
          ? recipeContent
          : (contentRef.current?.getContent()?.trim() ?? "");
      const mediaFiles = mediaRef.current?.getFiles() ?? [];
      const selectedTags = tagsRef.current?.getTags() ?? [];
      const quizData = quizRef.current?.getData();
      const pollData = pollRef.current?.getData();

      if (
        !content &&
        mediaFiles.length === 0 &&
        !recipeData &&
        templateMode !== "QUIZ" &&
        templateMode !== "POLL"
      ) {
        setIsSubmitting(false);
        return;
      }

      const isDraft = draftRef.current;
      const isPostNow = postNowRef.current;
      const isScheduled = !isPostNow && !!scheduledAt;
      draftRef.current = false;
      postNowRef.current = false;

      try {
        const keptUrls: string[] = mediaRef.current?.getKeptUrls() ?? [];
        const newlyUploadedUrls: string[] = await Promise.all(
          mediaFiles.map((file) => uploadPostImage(file, token!)),
        );
        const mediaUrls: string[] = [...keptUrls, ...newlyUploadedUrls];

        const payload: CreatePostPayload & { groupId?: string; mediaUrls: string[] } = {
          content:
            content ||
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

        if (templateMode === "QUIZ" && quizData) {
          payload.templateType = "QUIZ";
          payload.templateData = {
            type: "quiz",
            question: quizData.question,
            options: quizData.options,
            correctIndex: quizData.correctIndex,
          };
        } else if (templateMode === "POLL" && pollData) {
          payload.poll = {
            question: pollData.question,
            options: pollData.options,
            isMultipleChoice: pollData.isMultipleChoice,
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

        if (isEdit && fullPost?.id) {
          const updatePayload = { ...payload };
          delete updatePayload.groupId;
          await updatePost({ id: fullPost.id, ...updatePayload }).unwrap();
        } else {
          await create(payload).unwrap();
        }

        play("post-publish");
        toast.success(isScheduled ? "Post scheduled!" : isDraft ? "Draft saved!" : "Post shared!");
        resetAll();
        onCreated?.();
        onClose();
      } catch (err: unknown) {
        play("error");
        toast.error(getErrorMessage(err, "Failed to create post"));
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      create,
      updatePost,
      token,
      privacy,
      templateMode,
      recipeData,
      recipeContent,
      scheduledAt,
      isEdit,
      fullPost,
      groupId,
      play,
      onCreated,
      onClose,
      resetAll,
    ],
  );

  const handleTemplateSelect = useCallback((mode: TemplateMode) => {
    setTemplateMode(mode);
    mediaRef.current?.reset();
    if (mode !== "RECIPE") setRecipeData(null);
  }, []);

  const hasQuiz = templateMode === "QUIZ";
  const hasPoll = templateMode === "POLL";
  const hasBeforeAfter = templateMode === "BEFORE_AFTER";
  const hasRecipe = templateMode === "RECIPE";

  const initialTags = fullPost?.content
    ? [...new Set(fullPost.content.match(/#(\w+)/g)?.map((t) => t.slice(1)) ?? [])]
    : [];

  const quizTemplateData = fullPost?.templateData as
    | { question?: string; options?: string[]; correctIndex?: number }
    | undefined;
  const quizInitialData = fullPost?.templateData
    ? {
        question: quizTemplateData?.question ?? "",
        options: quizTemplateData?.options ?? [""],
        correctIndex: quizTemplateData?.correctIndex ?? 0,
      }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {isEdit ? "Edit post" : "Create post"}
          </DialogTitle>
          <DialogDescription>Share your health journey with the community.</DialogDescription>
        </DialogHeader>

        {isEdit && postLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {(!isEdit || !postLoading) && (
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Template selector */}
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => {
                const active = templateMode === t.value;
                const Icon = t.icon;
                return (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => handleTemplateSelect(t.value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                      active
                        ? "bg-gradient-to-r from-brand-teal to-brand-green text-white shadow-sm"
                        : "border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:border-brand-teal/40 hover:text-brand-teal",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Content editor area */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-overlay)] p-4">
              {hasBeforeAfter ? (
                <div className="flex flex-col gap-4">
                  <ContentEditor
                    ref={contentRef}
                    placeholder="Share your transformation story..."
                    initialContent={fullPost?.content ?? ""}
                  />
                  <MediaUploader
                    ref={mediaRef}
                    slots={[
                      { index: 0, label: "Before" },
                      { index: 1, label: "After" },
                    ]}
                    initialUrls={fullPost?.mediaUrls}
                  />
                </div>
              ) : hasRecipe ? (
                <RecipeForm
                  data={recipeData}
                  onChange={setRecipeData}
                  onContentChange={setRecipeContent}
                  content={recipeContent}
                />
              ) : hasQuiz ? (
                <QuizEditor ref={quizRef} initialData={quizInitialData} />
              ) : hasPoll ? (
                <PollEditor
                  ref={pollRef}
                  initialData={
                    fullPost?.poll
                      ? {
                          question: fullPost.poll.question ?? "",
                          options: fullPost.poll.options ?? [""],
                          isMultipleChoice: fullPost.poll.isMultipleChoice ?? false,
                        }
                      : undefined
                  }
                />
              ) : (
                <div className="flex flex-col gap-4">
                  <ContentEditor ref={contentRef} initialContent={fullPost?.content ?? ""} />
                  <MediaUploader ref={mediaRef} initialUrls={fullPost?.mediaUrls} />
                </div>
              )}
            </div>

            {/* Tags */}
            {!hasRecipe && <TagPicker ref={tagsRef} initialTags={initialTags} />}

            {/* Privacy + Schedule row */}
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-overlay)] px-4 py-3">
              <div className="flex items-center gap-1">
                {(
                  [
                    { value: "PUBLIC", icon: Globe, label: "Public" },
                    { value: "FRIENDS", icon: Users, label: "Friends" },
                    { value: "PRIVATE", icon: Lock, label: "Private" },
                  ] as const
                ).map((opt) => {
                  const active = privacy === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPrivacy(opt.value)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all",
                        active
                          ? "bg-gradient-to-r from-brand-teal to-brand-green text-white"
                          : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
                      )}
                    >
                      <Icon className="size-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="ml-auto flex items-center gap-2">
                {showSchedule ? (
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1.5">
                    <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" />
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-40 bg-transparent text-xs outline-none [color-scheme:dark]"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScheduledAt("");
                        setShowSchedule(false);
                      }}
                      className="shrink-0 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSchedule(true)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-muted)] hover:text-brand-teal transition-colors"
                  >
                    <Clock className="size-3.5" />
                    Schedule
                  </button>
                )}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between border-t border-[var(--border-default)] pt-4">
              <Button
                type="submit"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => (draftRef.current = true)}
                className="gap-2"
                size="sm"
              >
                <FileText className="size-3.5" />
                Save Draft
              </Button>

              <div className="flex gap-2">
                {scheduledAt ? (
                  <>
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => (postNowRef.current = true)}
                      className="gap-2"
                      size="sm"
                    >
                      Post Now
                    </Button>
                    <Button
                      type="submit"
                      variant="gradient"
                      disabled={isSubmitting}
                      className="gap-2"
                      size="sm"
                    >
                      {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                      {isSubmitting ? "Submitting..." : "Schedule Post"}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={isSubmitting}
                    onClick={() => (postNowRef.current = true)}
                    className="gap-2"
                    size="sm"
                  >
                    {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                    {isSubmitting ? "Posting..." : isEdit ? "Save" : "Post Now"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
