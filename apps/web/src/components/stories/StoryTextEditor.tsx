"use client";

import { cn } from "@/lib/utils";
import { useCreateStoryMutation } from "@/redux/api/storiesApi";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useState, useRef } from "react";
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
  { color: "#FF6B6B", label: "Red" },
  { color: "#4ECDC4", label: "Teal" },
  { color: "#45B7D1", label: "Blue" },
  { color: "#96CEB4", label: "Green" },
  { color: "#FFEAA7", label: "Yellow" },
  { color: "#DDA0DD", label: "Purple" },
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
  { color: "#0d9488", label: "Teal" },
  { color: "#1e293b", label: "Slate" },
];

const fontSizes = [
  { value: 20, label: "S" },
  { value: 28, label: "M" },
  { value: 36, label: "L" },
  { value: 48, label: "XL" },
  { value: 60, label: "XXL" },
];

const fontFamilies = [
  { value: "sans", label: "Sans", className: "font-sans" },
  { value: "serif", label: "Serif", className: "font-serif" },
  { value: "mono", label: "Mono", className: "font-mono" },
  { value: "cursive", label: "Script", className: "font-[cursive]" },
];

const textBgColors = [
  { color: "transparent", label: "None" },
  { color: "rgba(0,0,0,0.6)", label: "Dark" },
  { color: "rgba(255,255,255,0.2)", label: "Light" },
  { color: "rgba(255,107,107,0.4)", label: "Red" },
  { color: "rgba(78,205,196,0.4)", label: "Teal" },
];

const commonEmojis = [
  "😀",
  "😂",
  "😍",
  "🥰",
  "😎",
  "🤔",
  "😢",
  "😡",
  "🔥",
  "💯",
  "❤️",
  "💔",
  "⭐",
  "🎉",
  "🎂",
  "🌈",
  "👍",
  "👎",
  "👏",
  "🙌",
  "💪",
  "🤝",
  "✌️",
  "🫶",
  "🐱",
  "🐶",
  "🌸",
  "🌺",
  "🍕",
  "🍔",
  "☕",
  "🎵",
];

export function StoryTextEditor({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [textOverlay, setTextOverlay] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [backgroundColor, setBackgroundColor] = useState("#1a1a2e");
  const [textFontSize, setTextFontSize] = useState(36);
  const [textFontWeight, setTextFontWeight] = useState<"normal" | "bold">("bold");
  const [textPos, setTextPos] = useState({ x: 50, y: 20 });
  const [fontFamily, setFontFamily] = useState("sans");
  const [textBgColor, setTextBgColor] = useState("transparent");
  const [showEmoji, setShowEmoji] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [privacy, setPrivacy] = useState<"public" | "friends" | "private">("public");
  const [uploading, setUploading] = useState(false);

  const [createStory] = useCreateStoryMutation();
  const [createdStoryId, setCreatedStoryId] = useState<string | null>(null);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    posX: number;
    posY: number;
  } | null>(null);

  const handleShare = async () => {
    if (!textOverlay.trim()) return;
    setUploading(true);
    const toastId = toast.loading("Uploading story...");
    try {
      const story = await createStory({
        type: "text",
        privacy,
        backgroundColor,
        textOverlay: textOverlay.trim(),
        textColor,
        textBgColor,
        textFontSize,
        textFontWeight,
        textPosition: JSON.stringify(textPos),
      }).unwrap();
      setCreatedStoryId(story.id);
      toast.dismiss(toastId);
      toast.success("Story shared!");
    } catch {
      toast.dismiss(toastId);
      toast.error("Failed to share story");
    } finally {
      setUploading(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    setTextOverlay((prev) => prev + emoji);
    setShowEmoji(false);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!textOverlay.trim()) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
    setPanelCollapsed(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, posX: textPos.x, posY: textPos.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = ((e.clientX - dragRef.current.startX) / 400) * 100;
    const dy = ((e.clientY - dragRef.current.startY) / 600) * 100;
    setTextPos({
      x: Math.max(5, Math.min(95, dragRef.current.posX + dx)),
      y: Math.max(5, Math.min(85, dragRef.current.posY + dy)),
    });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className="h-full w-full">
      <div className="h-full w-full" style={{ backgroundColor }} />

      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/10" />

      <div className="absolute left-3 top-3 z-10">
        <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-medium text-white/60 backdrop-blur-sm">
          Your Story
        </span>
      </div>

      {/* Text Overlay Preview */}
      {textOverlay.trim() ? (
        <motion.div
          className={cn(
            "absolute z-10 select-none text-center drop-shadow-2xl touch-none cursor-grab active:cursor-grabbing",
            fontFamilies.find((f) => f.value === fontFamily)?.className,
          )}
          style={{ left: `${textPos.x}%`, top: `${textPos.y}%`, transform: "translate(-50%, 0)" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {textBgColor !== "transparent" && (
            <span
              className="absolute inset-0 -inset-x-2 -inset-y-1 rounded-lg"
              style={{ backgroundColor: textBgColor }}
            />
          )}
          <span
            className="relative"
            style={{
              color: textColor,
              fontSize: `${textFontSize}px`,
              fontWeight: textFontWeight,
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            {textOverlay || "Your text here"}
          </span>
        </motion.div>
      ) : (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <p className="text-sm text-white/20">Type something to preview</p>
        </div>
      )}

      {/* Top right buttons */}
      <div className="absolute right-12 top-3 z-30 flex gap-1">
        <button
          onClick={() => setPanelCollapsed(!panelCollapsed)}
          className="rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          title="Toggle panel"
        >
          {panelCollapsed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
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
              value={textOverlay}
              onChange={setTextOverlay}
              placeholder="Type your text here..."
              maxLength={200}
              showEmoji={showEmoji}
              onEmojiToggle={() => setShowEmoji(!showEmoji)}
            />

            <StoryEmojiGrid open={showEmoji} onSelect={insertEmoji} emojis={commonEmojis} />

            <StoryColorPicker
              label="Text Color"
              colors={textColors}
              value={textColor}
              onChange={setTextColor}
            />

            {/* Text Background */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70">
                Text Background
              </label>
              <div className="flex gap-2">
                {textBgColors.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => setTextBgColor(c.color)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-all",
                      textBgColor === c.color
                        ? "bg-brand-teal text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

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

            {/* Font Size */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white/70">Size</span>
              <div className="flex gap-1.5">
                {fontSizes.map((fs) => (
                  <button
                    key={fs.value}
                    onClick={() => setTextFontSize(fs.value)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
                      textFontSize === fs.value
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
                    onClick={() => setTextFontWeight(w)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                      textFontWeight === w
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
            {textOverlay.trim() && panelCollapsed && (
              <p className="text-center text-[10px] text-white/30">
                Expand panel ↑ to drag text freely
              </p>
            )}

            <StoryPrivacySelector value={privacy} onChange={setPrivacy} />
          </div>

          <StoryActionButtons
            onCancel={onClose}
            onShare={handleShare}
            uploading={uploading}
            disabled={!textOverlay.trim()}
            label="Share Story"
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
