"use client";

import { useState, forwardRef, useImperativeHandle, memo, useCallback } from "react";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ContentEditorHandle {
  getContent(): string;
  reset(): void;
}

interface ContentEditorProps {
  initialContent?: string;
  placeholder?: string;
  maxLength?: number;
}

export const ContentEditor = memo(
  forwardRef<ContentEditorHandle, ContentEditorProps>(function ContentEditor(
    { initialContent = "", placeholder = "Share your health journey...", maxLength = 2000 },
    ref,
  ) {
    const [content, setContent] = useState(initialContent);

    useImperativeHandle(
      ref,
      () => ({
        getContent: () => content,
        reset: () => setContent(""),
      }),
      [content],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value),
      [],
    );

    const charsOverEighty = content.length > maxLength * 0.8;
    const charsAtLimit = content.length >= maxLength;

    return (
      <Field>
        <FieldLabel htmlFor="content" className="sr-only">
          What&apos;s on your mind?
        </FieldLabel>
        <Textarea
          id="content"
          value={content}
          onChange={handleChange}
          placeholder={placeholder}
          className="min-h-[80px]"
          maxLength={maxLength}
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
          {content.length}/{maxLength}
        </FieldDescription>
      </Field>
    );
  }),
);
