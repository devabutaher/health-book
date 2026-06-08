"use client";

import { useCreateStoryMutation } from "@/redux/api/storiesApi";
import { motion } from "framer-motion";
import { Eye, EyeOff, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { StoryActionButtons } from "./editor/StoryActionButtons";
import { StoryCollapsiblePanel } from "./editor/StoryCollapsiblePanel";
import { StoryColorPicker } from "./editor/StoryColorPicker";
import { StoryEmojiGrid } from "./editor/StoryEmojiGrid";
import { StoryHighlightPanel } from "./editor/StoryHighlightPanel";
import { StoryInputWithEmoji } from "./editor/StoryInputWithEmoji";
import { StoryPrivacySelector } from "./editor/StoryPrivacySelector";

const textColors = [
  { color: "#ffffff", label: "White" },
  { color: "#000000", label: "Black" },
  { color: "#4ECDC4", label: "Teal" },
  { color: "#45B7D1", label: "Blue" },
  { color: "#96CEB4", label: "Green" },
  { color: "#FFEAA7", label: "Yellow" },
];

const bgColors = [
  { color: "#000000", label: "Black" },
  { color: "#1a1a2e", label: "Navy" },
  { color: "#2d1b69", label: "Purple" },
  { color: "#6b21a8", label: "Deep Purple" },
  { color: "#dc2626", label: "Red" },
  { color: "#ea580c", label: "Orange" },
  { color: "#2563eb", label: "Blue" },
  { color: "#059669", label: "Green" },
];

const commonEmojis = [
  "😀",
  "😂",
  "😍",
  "😎",
  "🤔",
  "🔥",
  "💯",
  "❤️",
  "👍",
  "👎",
  "👏",
  "🙌",
  "💪",
  "🎉",
  "⭐",
  "🌈",
];

export function StoryPollEditor({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [textColor, setTextColor] = useState("#ffffff");
  const [backgroundColor, setBackgroundColor] = useState("#1a1a2e");
  const [showEmoji, setShowEmoji] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [privacy, setPrivacy] = useState<"public" | "friends" | "private">("public");
  const [uploading, setUploading] = useState(false);
  const [createdStoryId, setCreatedStoryId] = useState<string | null>(null);

  const [createStory] = useCreateStoryMutation();

  const validOptions = options.filter((o) => o.trim()).length;
  const canShare = question.trim() && validOptions >= 2;

  const handleShare = async () => {
    if (!canShare) return;
    setUploading(true);
    const toastId = toast.loading("Uploading story...");
    try {
      const story = await createStory({
        type: "poll",
        privacy,
        backgroundColor,
        stickerData: {
          type: "poll",
          question: question.trim(),
          options: options.filter((o) => o.trim()).map((o) => o.trim()),
          backgroundColor,
        },
      }).unwrap();
      setCreatedStoryId(story.id);
      toast.dismiss(toastId);
      toast.success("Poll shared!");
    } catch {
      toast.dismiss(toastId);
      toast.error("Failed to share poll");
    } finally {
      setUploading(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    setQuestion((prev) => prev + emoji);
    setShowEmoji(false);
  };

  return (
    <div className="h-full w-full">
      <div className="h-full w-full" style={{ backgroundColor }} />

      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/10" />

      <div className="absolute left-3 top-3 z-10">
        <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-medium text-white/60 backdrop-blur-sm">
          Poll
        </span>
      </div>

      {/* Panel toggle */}
      <div className="absolute right-12 top-3 z-30 flex gap-1">
        <button
          onClick={() => setPanelCollapsed(!panelCollapsed)}
          className="rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          title="Toggle panel"
        >
          {panelCollapsed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {/* Preview content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-5">
        {question ? (
          <motion.div
            layout
            className="w-full rounded-2xl bg-black/40 px-5 py-4 text-center backdrop-blur-sm"
          >
            <p className="font-bold leading-snug" style={{ color: textColor, fontSize: "20px" }}>
              {question}
            </p>
          </motion.div>
        ) : (
          <div className="w-full rounded-2xl border-2 border-dashed border-white/20 px-5 py-4 text-center">
            <p className="text-sm text-white/40">Your poll question will appear here</p>
          </div>
        )}

        <div className="w-full space-y-2.5">
          {options
            .filter((o) => o.trim())
            .map((opt, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white/90 backdrop-blur-sm"
              >
                {opt}
              </motion.div>
            ))}
          {!options.some((o) => o.trim()) && (
            <div className="rounded-2xl border-2 border-dashed border-white/15 px-4 py-3 text-center text-xs text-white/30">
              Options appear here
            </div>
          )}
        </div>
      </div>

      {/* Bottom Tools Panel */}
      {!createdStoryId && (
        <StoryCollapsiblePanel
          collapsed={panelCollapsed}
          onToggle={() => setPanelCollapsed(!panelCollapsed)}
        >
          <div className="space-y-3 px-3 pb-2">
            <StoryColorPicker
              label="Background"
              colors={bgColors}
              value={backgroundColor}
              onChange={setBackgroundColor}
              swatchSize="md"
            />

            <StoryInputWithEmoji
              value={question}
              onChange={setQuestion}
              placeholder="Poll question..."
              maxLength={150}
              showEmoji={showEmoji}
              onEmojiToggle={() => setShowEmoji(!showEmoji)}
            />

            <StoryEmojiGrid open={showEmoji} onSelect={insertEmoji} emojis={commonEmojis} />

            {/* Options */}
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[idx] = e.target.value;
                    setOptions(next);
                  }}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 rounded-xl bg-white/15 px-4 py-2.5 text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-brand-teal"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                    className="rounded-xl bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30"
                  >
                    <Minus className="size-4" />
                  </button>
                )}
              </div>
            ))}
            {options.length < 4 && (
              <button
                onClick={() => setOptions([...options, ""])}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 p-2.5 text-sm text-white/80 hover:bg-white/20"
              >
                <Plus className="size-4" /> Add Option
              </button>
            )}

            <StoryColorPicker
              label="Text Color"
              colors={textColors}
              value={textColor}
              onChange={setTextColor}
            />

            <StoryPrivacySelector value={privacy} onChange={setPrivacy} />
          </div>

          <StoryActionButtons
            onCancel={onClose}
            onShare={handleShare}
            uploading={uploading}
            disabled={!canShare}
            label="Share Poll"
          />
        </StoryCollapsiblePanel>
      )}

      {createdStoryId && (
        <StoryHighlightPanel
          createdStoryId={createdStoryId}
          onClose={onClose}
          onCreated={onCreated}
        />
      )}
    </div>
  );
}
