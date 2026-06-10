"use client";

import { useState, useRef, forwardRef, useImperativeHandle, memo, useCallback } from "react";
import { ImagePlus, X } from "lucide-react";

export interface MediaFile {
  file: File;
  preview: string;
}

export interface MediaUploaderHandle {
  getMedia(): MediaFile[];
  getFiles(): File[];
  getPreviews(): string[];
  reset(): void;
}

interface BeforeAfterSlot {
  index: number;
  label: string;
}

interface MediaUploaderProps {
  maxFiles?: number;
  /** null = free-form uploads, a slot array = before/after mode */
  slots?: BeforeAfterSlot[];
}

export const MediaUploader = memo(
  forwardRef<MediaUploaderHandle, MediaUploaderProps>(function MediaUploader(
    { maxFiles = 10, slots },
    ref,
  ) {
    const [media, setMedia] = useState<MediaFile[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const removeFile = useCallback((index: number) => {
      setMedia((prev) => {
        const item = prev[index];
        if (item) URL.revokeObjectURL(item.preview);
        return prev.filter((_, i) => i !== index);
      });
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        getMedia: () => media,
        getFiles: () => media.map((m) => m.file),
        getPreviews: () => media.map((m) => m.preview),
        reset: () => {
          media.forEach((m) => URL.revokeObjectURL(m.preview));
          setMedia([]);
        },
      }),
      [media],
    );

    const handleFileSelect = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        if (selected.length === 0) return;
        const remaining = maxFiles - media.length;
        const allowed = selected.slice(0, remaining);
        setMedia((prev) => [
          ...prev,
          ...allowed.map((f) => ({ file: f, preview: URL.createObjectURL(f) })),
        ]);
        e.target.value = "";
      },
      [maxFiles, media.length],
    );

    // Before/After mode — 2 fixed slots
    if (slots) {
      return (
        <div className="grid grid-cols-2 gap-3">
          {slots.map((slot) => {
            const existing = media[slot.index];
            return (
              <div key={slot.index} className="flex flex-col gap-1">
                <p className="text-xs font-medium text-muted-foreground">{slot.label}</p>
                {existing ? (
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--glass-border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={existing.preview} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(slot.index)}
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
                    + Add {slot.label}
                  </button>
                )}
              </div>
            );
          })}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      );
    }

    // Free-form grid mode
    return (
      <>
        {media.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {media.map((item, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--glass-border)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.preview} alt="" className="size-full object-cover" />
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

        {media.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={media.length >= maxFiles}
            className="flex min-h-[120px] w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-default)] transition-colors hover:border-brand-teal/50 hover:bg-[var(--bg-overlay)]"
          >
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
              <ImagePlus className="size-8" />
              <span className="text-sm font-medium">Click to upload images</span>
              <span className="text-xs">Up to {maxFiles} images</span>
            </div>
          </button>
        ) : (
          <div className="flex items-center justify-between rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-overlay)] px-4 py-2.5">
            <span className="text-sm text-muted-foreground">
              {media.length} image{media.length > 1 ? "s" : ""} selected
            </span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-sm font-medium text-brand-teal hover:underline"
            >
              Add more
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </>
    );
  }),
);
