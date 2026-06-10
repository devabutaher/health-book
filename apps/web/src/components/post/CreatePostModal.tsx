"use client";

import { useState, useRef, useCallback } from "react";
import { CalendarClock, Clock, FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCreatePostMutation, useUpdatePostMutation, uploadPostImage } from "@/redux/api/postApi";
import { useAppSelector } from "@/hooks";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useSound } from "@/hooks/useSound";
import RecipeForm from "../health/RecipeForm";
import { ContentEditor } from "./ContentEditor";
import type { ContentEditorHandle } from "./ContentEditor";
import { MediaUploader } from "./MediaUploader";
import type { MediaUploaderHandle } from "./MediaUploader";
import { QuizEditor } from "./QuizEditor";
import type { QuizEditorHandle } from "./QuizEditor";
import { PollEditor } from "./PollEditor";
import type { PollEditorHandle } from "./PollEditor";
import { TagPicker } from "./TagPicker";
import type { TagPickerHandle } from "./TagPicker";
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
  const [create] = useCreatePostMutation();
  const [updatePost] = useUpdatePostMutation();
  const { play } = useSound();
  const isEdit = !!initialPost;
  const [templateMode, setTemplateMode] = useState<TemplateMode>(null);
  const [recipeData, setRecipeData] = useState<Record<string, unknown> | null>(null);
  const [recipeContent, setRecipeContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contentRef = useRef<ContentEditorHandle>(null);
  const mediaRef = useRef<MediaUploaderHandle>(null);
  const tagsRef = useRef<TagPickerHandle>(null);
  const quizRef = useRef<QuizEditorHandle>(null);
  const pollRef = useRef<PollEditorHandle>(null);

  const formRef = useRef<HTMLFormElement>(null);

  const draftRef = useRef(false);
  const postNowRef = useRef(false);

  const privacy = initialPost?.privacy || "PUBLIC";

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
        // Step 1 — upload images to Cloudinary FIRST
        const mediaUrls: string[] = await Promise.all(
          mediaFiles.map((file) => uploadPostImage(file, token!)),
        );

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

        // Step 2 — create or update post WITH media URLs in a single call
        if (isEdit && initialPost?.id) {
          const updatePayload = { ...payload };
          delete updatePayload.groupId;
          await updatePost({ id: initialPost.id, ...updatePayload }).unwrap();
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
      initialPost,
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
  const isPlainMode = !templateMode;

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
            {hasBeforeAfter ? (
              <>
                <ContentEditor ref={contentRef} placeholder="Share your transformation story..." />
                <MediaUploader
                  ref={mediaRef}
                  slots={[
                    { index: 0, label: "Before" },
                    { index: 1, label: "After" },
                  ]}
                />
              </>
            ) : hasRecipe ? (
              <RecipeForm
                data={recipeData}
                onChange={setRecipeData}
                onContentChange={setRecipeContent}
                content={recipeContent}
              />
            ) : hasQuiz ? (
              <QuizEditor ref={quizRef} />
            ) : hasPoll ? (
              <PollEditor ref={pollRef} />
            ) : (
              <>
                <ContentEditor ref={contentRef} />
                <MediaUploader ref={mediaRef} />
              </>
            )}
          </FieldGroup>

          {isPlainMode && <TagPicker ref={tagsRef} />}

          {hasBeforeAfter && <TagPicker ref={tagsRef} />}
          {hasQuiz && <TagPicker ref={tagsRef} />}
          {hasPoll && <TagPicker ref={tagsRef} />}

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
            disabled={isSubmitting}
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
                disabled={isSubmitting}
                onClick={() => (postNowRef.current = true)}
                className="flex-1 gap-2"
              >
                Post Now →
              </Button>
              <Button type="submit" variant="gradient" disabled={isSubmitting} className="flex-[2]">
                {isSubmitting && <Loader2 className="animate-spin" />}
                {isSubmitting ? "Submitting..." : "Schedule Post"}
              </Button>
            </div>
          ) : (
            <Button
              type="submit"
              variant="gradient"
              disabled={isSubmitting}
              onClick={() => (postNowRef.current = true)}
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isSubmitting ? "Posting..." : isEdit ? "Save" : "Post"}
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
