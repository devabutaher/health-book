"use client";

import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { StoryCreationPicker } from "./StoryCreationPicker";
import { StoryMediaEditor } from "./StoryMediaEditor";
import { StoryTextEditor } from "./StoryTextEditor";
import { StoryQuizEditor } from "./StoryQuizEditor";
import { StoryPollEditor } from "./StoryPollEditor";

export function StoryCreateButton({ onStoryCreated }: { onStoryCreated?: () => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const [pendingType, setPendingType] = useState<"media" | "text" | "quiz" | "poll" | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePickerSelect = (type: "media" | "text" | "quiz" | "poll") => {
    setShowPicker(false);
    if (type === "media") {
      inputRef.current?.click();
    } else {
      setPendingType(type);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    e.target.value = "";
  };

  const handleClose = () => {
    setShowPicker(false);
    setPendingType(null);
    setPendingFile(null);
  };

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setShowPicker(true)}
        className="relative flex h-44 w-28 flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-brand-teal/20 to-brand-green/10 transition-transform active:scale-95"
      >
        <div className="flex size-10 items-center justify-center rounded-full border-2 border-dashed border-white/40 bg-white/10">
          <Plus className="size-5 text-white" />
        </div>
        <span className="absolute bottom-2 left-2 right-2 truncate text-center text-[11px] font-semibold text-white/70">
          Your Story
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {showPicker &&
        createPortal(
          <StoryCreationPicker
            onSelect={handlePickerSelect}
            onClose={() => setShowPicker(false)}
          />,
          document.body,
        )}

      {pendingFile &&
        createPortal(
          <StoryMediaEditor file={pendingFile} onClose={handleClose} onCreated={onStoryCreated} />,
          document.body,
        )}

      {pendingType === "text" &&
        createPortal(
          <StoryTextEditor onClose={handleClose} onCreated={onStoryCreated} />,
          document.body,
        )}

      {pendingType === "quiz" &&
        createPortal(
          <StoryQuizEditor onClose={handleClose} onCreated={onStoryCreated} />,
          document.body,
        )}

      {pendingType === "poll" &&
        createPortal(
          <StoryPollEditor onClose={handleClose} onCreated={onStoryCreated} />,
          document.body,
        )}
    </div>
  );
}
