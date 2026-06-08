"use client";

import { cn } from "@/lib/utils";
import { useCreateStoryMutation } from "@/redux/api/storiesApi";
import { motion } from "framer-motion";
import { Check, Eye, EyeOff, Minus, Plus } from "lucide-react";
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
  { color: "#0f4c75", label: "Ocean" },
  { color: "#1b4332", label: "Forest" },
  { color: "#7b2d00", label: "Rust" },
  { color: "#2c1810", label: "Dark Brown" },
  { color: "#1a0533", label: "Deep Purple" },
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

export function StoryQuizEditor({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIdx, setCorrectIdx] = useState<number | null>(null);
  const [textColor, setTextColor] = useState("#ffffff");
  const [backgroundColor, setBackgroundColor] = useState("#1a0533");
  const [showEmoji, setShowEmoji] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [privacy, setPrivacy] = useState<"public" | "friends" | "private">("public");
  const [uploading, setUploading] = useState(false);
  const [createdStoryId, setCreatedStoryId] = useState<string | null>(null);

  const [createStory] = useCreateStoryMutation();

  const validOptions = options.filter((o) => o.trim());
  const canShare =
    question.trim() &&
    validOptions.length >= 2 &&
    correctIdx !== null &&
    options[correctIdx]?.trim();

  const handleShare = async () => {
    if (!canShare) return;
    setUploading(true);
    const toastId = toast.loading("Uploading story...");
    try {
      const story = await createStory({
        type: "quiz",
        privacy,
        backgroundColor,
        stickerData: {
          type: "quiz",
          question: question.trim(),
          options: options.filter((o) => o.trim()).map((o) => o.trim()),
          correctOptionIndex: correctIdx ?? 0,
          backgroundColor,
        },
      }).unwrap();
      setCreatedStoryId(story.id);
      toast.dismiss(toastId);
      toast.success("Quiz shared!");
    } catch {
      toast.dismiss(toastId);
      toast.error("Failed to share quiz");
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
        <span className="rounded-full bg-amber-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300 backdrop-blur-sm border border-amber-500/30">
          Quiz ✨
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
            <p className="text-sm text-white/40">Your quiz question will appear here</p>
          </div>
        )}

        <div className="w-full space-y-2.5">
          {options.map((opt, idx) => {
            if (!opt.trim()) return null;
            const isCorrect = idx === correctIdx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm backdrop-blur-sm transition-all",
                  isCorrect
                    ? "border-brand-green/50 bg-brand-green/20 text-white"
                    : "border-white/20 bg-white/10 text-white/90",
                )}
              >
                {isCorrect && <Check className="size-4 shrink-0 text-brand-green" />}
                <span className={isCorrect ? "font-semibold" : ""}>{opt}</span>
              </motion.div>
            );
          })}
          {!options.some((o) => o.trim()) && (
            <div className="rounded-2xl border-2 border-dashed border-white/15 px-4 py-3 text-center text-xs text-white/30">
              Options appear here
            </div>
          )}
        </div>

        {correctIdx === null && options.some((o) => o.trim()) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-amber-400/80"
          >
            ↓ Mark the correct answer below
          </motion.p>
        )}
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
              placeholder="Quiz question..."
              maxLength={150}
              showEmoji={showEmoji}
              onEmojiToggle={() => setShowEmoji(!showEmoji)}
              focusColor="focus:ring-amber-500"
            />

            <StoryEmojiGrid open={showEmoji} onSelect={insertEmoji} emojis={commonEmojis} />

            {/* Options */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70">
                Options — tap ✓ to mark correct answer
              </label>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      onClick={() => setCorrectIdx(idx === correctIdx ? null : idx)}
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                        correctIdx === idx
                          ? "border-brand-green bg-brand-green text-white"
                          : "border-white/20 bg-white/5 text-white/30 hover:border-white/40 hover:text-white/60",
                      )}
                    >
                      <Check className="size-4" />
                    </button>
                    <input
                      value={opt}
                      onChange={(e) => {
                        const next = [...options];
                        next[idx] = e.target.value;
                        setOptions(next);
                      }}
                      placeholder={`Option ${idx + 1}${correctIdx === idx ? " ✓ Correct" : ""}`}
                      className={cn(
                        "flex-1 rounded-xl px-4 py-2.5 text-white placeholder:text-white/50 outline-none focus:ring-2 transition-all",
                        correctIdx === idx
                          ? "bg-brand-green/20 ring-2 ring-brand-green/50 focus:ring-brand-green"
                          : "bg-white/15 focus:ring-amber-500",
                      )}
                    />
                    {options.length > 2 && (
                      <button
                        onClick={() => {
                          setOptions(options.filter((_, i) => i !== idx));
                          if (correctIdx === idx) setCorrectIdx(null);
                          else if (correctIdx !== null && correctIdx > idx)
                            setCorrectIdx(correctIdx - 1);
                        }}
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
              </div>
            </div>

            <StoryColorPicker
              label="Text Color"
              colors={textColors}
              value={textColor}
              onChange={setTextColor}
            />

            <StoryPrivacySelector
              value={privacy}
              onChange={setPrivacy}
              activeColor="bg-amber-500"
            />
          </div>

          <StoryActionButtons
            onCancel={onClose}
            onShare={handleShare}
            uploading={uploading}
            disabled={!canShare}
            label="Share Quiz"
            gradientFrom="from-amber-500"
            gradientTo="to-orange-500"
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
