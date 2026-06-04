"use client";

import { cn } from "@/lib/utils";
import { useAddHighlightItemMutation, useGetHighlightsQuery } from "@/redux/api/highlightsApi";
import { useCreateStoryMutation } from "@/redux/api/storiesApi";
import { motion } from "framer-motion";
import { Send, X, Plus, Minus, Eye, EyeOff, Smile } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

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

const fontSizes = [
  { value: 16, label: "S" },
  { value: 22, label: "M" },
  { value: 28, label: "L" },
  { value: 36, label: "XL" },
];

const fontFamilies = [
  { value: "sans", label: "Sans", className: "font-sans" },
  { value: "serif", label: "Serif", className: "font-serif" },
  { value: "mono", label: "Mono", className: "font-mono" },
  { value: "cursive", label: "Script", className: "font-[cursive]" },
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
  const [fontSize, setFontSize] = useState(22);
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("bold");
  const [fontFamily, setFontFamily] = useState("sans");
  const [questionPos, setQuestionPos] = useState({ x: 50, y: 30 });
  const [showEmoji, setShowEmoji] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [privacy, setPrivacy] = useState<"public" | "friends" | "private">("public");
  const [uploading, setUploading] = useState(false);

  const [createStory] = useCreateStoryMutation();
  const { data: highlights } = useGetHighlightsQuery();
  const [addHighlightItem] = useAddHighlightItemMutation();
  const [createdStoryId, setCreatedStoryId] = useState<string | null>(null);

  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(
    null,
  );

  const validOptions = options.filter((o) => o.trim()).length;
  const canShare = question.trim() && validOptions >= 2;

  const handleShare = async () => {
    if (!canShare) return;
    setUploading(true);
    try {
      const story = await createStory({
        type: "poll",
        privacy,
        backgroundColor,
        textFontSize: fontSize,
        textFontWeight: fontWeight,
        textPosition: JSON.stringify(questionPos),
        stickerData: {
          type: "poll",
          question: question.trim(),
          options: options.filter((o) => o.trim()).map((o) => o.trim()),
          backgroundColor,
        },
      }).unwrap();

      setCreatedStoryId(story.id);
      toast.success("Poll shared!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to share poll");
    } finally {
      setUploading(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    setQuestion((prev) => prev + emoji);
    setShowEmoji(false);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!previewMode || !question.trim()) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: questionPos.x,
      posY: questionPos.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = ((e.clientX - dragRef.current.startX) / 400) * 100;
    const dy = ((e.clientY - dragRef.current.startY) / 600) * 100;
    setQuestionPos({
      x: Math.max(5, Math.min(95, dragRef.current.posX + dx)),
      y: Math.max(5, Math.min(85, dragRef.current.posY + dy)),
    });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) onClose();
      }}
    >
      <div className="relative aspect-[9/16] h-full max-h-[90vh] w-full max-w-sm">
        {/* Background */}
        <div className="h-full w-full" style={{ backgroundColor }} />

        {/* Phone bezel border */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/10" />

        {/* "Your Story" label */}
        <div className="absolute left-3 top-3 z-10">
          <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-medium text-white/60 backdrop-blur-sm">
            Your Story
          </span>
        </div>

        {/* Preview */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
          {question && (
            <motion.p
              className={cn(
                "mb-6 text-center drop-shadow-2xl",
                fontFamilies.find((f) => f.value === fontFamily)?.className,
              )}
              style={{
                color: textColor,
                fontSize: `${fontSize}px`,
                fontWeight,
                position: "absolute",
                left: `${questionPos.x}%`,
                top: `${questionPos.y}%`,
                transform: "translate(-50%, 0)",
                textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {question}
            </motion.p>
          )}

          {/* Options always at bottom */}
          <div className="absolute inset-x-4 bottom-24 w-auto space-y-2.5">
            {options
              .filter((o) => o.trim())
              .map((opt) => (
                <div
                  key={opt}
                  className="rounded-xl border border-white/20 px-4 py-3 text-sm text-white/90"
                >
                  {opt}
                </div>
              ))}
          </div>
        </div>

        {/* Top right buttons */}
        <div className="absolute right-3 top-3 z-30 flex gap-1">
          {question.trim() && (
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              title={previewMode ? "Edit" : "Preview"}
            >
              {previewMode ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tap preview area to return to edit */}
        {previewMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-20 cursor-pointer"
            onClick={() => setPreviewMode(false)}
          />
        )}

        {/* Bottom Tools Panel */}
        {!createdStoryId && !previewMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 z-30 max-h-[60vh] overflow-y-auto border-t border-white/10 bg-[#0a0a0a] backdrop-blur-xl"
          >
            <div className="space-y-3 p-3">
              {/* Background Color */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Background</label>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {bgColors.map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setBackgroundColor(c.color)}
                      className={cn(
                        "size-8 shrink-0 rounded-full border-2 transition-all",
                        backgroundColor === c.color
                          ? "scale-110 border-white shadow-lg"
                          : "border-transparent hover:scale-105",
                      )}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    />
                  ))}
                  <label className="relative size-8 shrink-0 cursor-pointer rounded-full border-2 border-dashed border-white/30 bg-white/5 transition-colors hover:bg-white/15">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <span className="flex h-full items-center justify-center text-[10px] text-white/50">
                      +
                    </span>
                  </label>
                </div>
              </div>

              {/* Question + Emoji */}
              <div className="relative">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Poll question..."
                  maxLength={150}
                  className="w-full rounded-lg bg-white/15 px-4 py-3 pr-20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
                  <button
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="rounded-full p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Smile className="size-4" />
                  </button>
                  {question && <span className="text-xs text-white/50">{question.length}/150</span>}
                </div>
              </div>

              {/* Emoji Picker */}
              {showEmoji && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex flex-wrap gap-1.5 rounded-xl bg-white/10 p-2"
                >
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="flex size-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-white/15"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}

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
                    className="flex-1 rounded-lg bg-white/15 px-4 py-2.5 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                      className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30"
                    >
                      <Minus className="size-4" />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 4 && (
                <button
                  onClick={() => setOptions([...options, ""])}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 p-2.5 text-sm text-white/80 hover:bg-white/20"
                >
                  <Plus className="size-4" /> Add Option
                </button>
              )}

              {/* Font Family */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Font</label>
                <div className="flex gap-1.5">
                  {fontFamilies.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFontFamily(f.value)}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                        fontFamily === f.value
                          ? "bg-brand-teal text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20",
                        f.className,
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Color */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Text Color</label>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {textColors.map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setTextColor(c.color)}
                      className={cn(
                        "size-7 shrink-0 rounded-full border-2 transition-all",
                        textColor === c.color
                          ? "scale-110 border-white shadow-lg"
                          : "border-transparent hover:scale-105",
                      )}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    />
                  ))}
                  <label className="relative size-7 shrink-0 cursor-pointer rounded-full border-2 border-dashed border-white/30 bg-white/5 transition-colors hover:bg-white/15">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <span className="flex h-full items-center justify-center text-[10px] text-white/50">
                      +
                    </span>
                  </label>
                </div>
              </div>

              {/* Font Size */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white/70">Size</span>
                <div className="flex gap-1.5">
                  {fontSizes.map((fs) => (
                    <button
                      key={fs.value}
                      onClick={() => setFontSize(fs.value)}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
                        fontSize === fs.value
                          ? "bg-brand-teal text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20",
                      )}
                    >
                      {fs.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Weight */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white/70">Weight</span>
                <div className="flex gap-1.5">
                  {(["normal", "bold"] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => setFontWeight(w)}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                        fontWeight === w
                          ? "bg-brand-teal text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20",
                      )}
                    >
                      {w === "bold" ? "Bold" : "Normal"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position hint */}
              <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
                <span className="text-[10px] text-white/40">
                  {previewMode ? "" : "Tap Preview to drag question to any position"}
                </span>
              </div>

              {/* Privacy */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white/70">Who can see</span>
                <div className="flex gap-1">
                  {(["public", "friends", "private"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPrivacy(p)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-all",
                        privacy === p
                          ? "bg-brand-teal text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20",
                      )}
                    >
                      {p === "public" ? "🌍 Public" : p === "friends" ? "👥 Friends" : "🔒 Only Me"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 border-t border-white/10 p-3">
              <button
                onClick={onClose}
                disabled={uploading}
                className="flex-1 rounded-full bg-white/10 py-3 font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={uploading || !canShare}
                className="flex-1 rounded-full bg-gradient-to-r from-brand-teal to-brand-green py-3 font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sharing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Send className="size-4" />
                    Share Poll
                  </div>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Highlight Selection */}
        {createdStoryId && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="absolute inset-x-0 bottom-0 z-30 rounded-t-2xl border-t border-white/10 bg-[#0a0a0a] p-4 backdrop-blur-xl"
          >
            <h3 className="mb-3 text-center text-sm font-semibold text-white">
              Save to Highlight?
            </h3>
            <div className="mb-3 flex max-h-32 flex-wrap justify-center gap-2 overflow-y-auto">
              {highlights && highlights.length > 0 ? (
                highlights.map((hl) => (
                  <button
                    key={hl.id}
                    onClick={async () => {
                      try {
                        await addHighlightItem({
                          highlightId: hl.id,
                          storyId: createdStoryId,
                        }).unwrap();
                        toast.success(`Added to ${hl.title}`);
                        onCreated?.();
                        onClose();
                      } catch {
                        toast.error("Failed to add to highlight");
                      }
                    }}
                    className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25"
                  >
                    {hl.title}
                  </button>
                ))
              ) : (
                <p className="text-center text-sm text-white/50">
                  No highlights yet. Create one from your profile.
                </p>
              )}
            </div>
            <button
              onClick={() => {
                onCreated?.();
                onClose();
              }}
              className="w-full rounded-full bg-white/20 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/30"
            >
              Skip
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
