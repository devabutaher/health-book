"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppSelector } from "@/hooks";
import { cn } from "@/lib/utils";
import { useCreateStoryMutation } from "@/redux/api/storiesApi";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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

const fontSizes = [
  { value: 16, label: "S" },
  { value: 24, label: "M" },
  { value: 32, label: "L" },
  { value: 40, label: "XL" },
  { value: 52, label: "XXL" },
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
  "😀", "😂", "😍", "🥰", "😎", "🤔", "😢", "😡",
  "🔥", "💯", "❤️", "💔", "⭐", "🎉", "🎂", "🌈",
  "👍", "👎", "👏", "🙌", "💪", "🤝", "✌️", "🫶",
];

export function StoryMediaEditor({
  file,
  onClose,
  onCreated,
}: {
  file: File;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const user = useAppSelector((s) => s.auth.user);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const [textOverlay, setTextOverlay] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textFontSize, setTextFontSize] = useState(32);
  const [textFontWeight, setTextFontWeight] = useState<"normal" | "bold">("bold");
  const [textPos, setTextPos] = useState({ x: 50, y: 20 });
  const [fontFamily, setFontFamily] = useState("sans");
  const [textBgColor, setTextBgColor] = useState("transparent");
  const [showEmoji, setShowEmoji] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [privacy, setPrivacy] = useState<"public" | "friends" | "private">("public");
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string>("");
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [createdStoryId, setCreatedStoryId] = useState<string | null>(null);

  const [createStory] = useCreateStoryMutation();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number; startY: number;
    posX: number; posY: number;
    rectW: number; rectH: number;
  } | null>(null);

  useEffect(() => {
    if (!file) return;
    setMediaType(file.type.startsWith("video/") ? "video" : "image");
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!videoRef.current || mediaType !== "video") return;
    const vid = videoRef.current;
    const onLoaded = () => setDuration(vid.duration);
    vid.addEventListener("loadedmetadata", onLoaded);
    return () => vid.removeEventListener("loadedmetadata", onLoaded);
  }, [mediaType]);

  const handleShare = async () => {
    if (!user) return;
    setUploading(true);
    const toastId = toast.loading("Uploading story...");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const mediaRes = await fetch(`${process.env["NEXT_PUBLIC_API_URL"]}/api/posts/media`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const mediaData = await mediaRes.json();
      if (!mediaData.success || !mediaData.data?.url) throw new Error("Upload failed");

      const story = await createStory({
        type: "media",
        privacy,
        mediaUrl: mediaData.data.url,
        mediaType: mediaType ?? "image",
        duration: Math.round(duration) || undefined,
        textOverlay: textOverlay.trim() || undefined,
        textColor: textOverlay.trim() ? textColor : undefined,
        textBgColor: textOverlay.trim() ? textBgColor : undefined,
        textFontSize: textOverlay.trim() ? textFontSize : undefined,
        textFontWeight: textOverlay.trim() ? textFontWeight : undefined,
        textPosition: textOverlay.trim() ? JSON.stringify(textPos) : undefined,
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
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setPanelCollapsed(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      posX: textPos.x, posY: textPos.y,
      rectW: rect.width, rectH: rect.height,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.preventDefault();
    const dx = ((e.clientX - dragRef.current.startX) / dragRef.current.rectW) * 100;
    const dy = ((e.clientY - dragRef.current.startY) / dragRef.current.rectH) * 100;
    setTextPos({
      x: Math.max(5, Math.min(95, dragRef.current.posX + dx)),
      y: Math.max(5, Math.min(90, dragRef.current.posY + dy)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
  };

  const fontClass = fontFamilies.find((f) => f.value === fontFamily)?.className;

  return (
    <div ref={containerRef} className="h-full w-full">
      {/* Media Preview */}
      {localPreview ? (
        mediaType === "video" ? (
          <video ref={videoRef} src={localPreview} className="h-full w-full object-contain" autoPlay playsInline muted loop />
        ) : (
          <Image src={localPreview} alt="Story media preview" className="h-full w-full object-contain" width={400} height={712} />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-black/50">
          <div className="size-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/10" />

      <div className="absolute left-3 top-3 z-10">
        <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-medium text-white/60 backdrop-blur-sm">
          Your Story
        </span>
      </div>

      {/* Preview toggle */}
      <div className="absolute right-12 top-3 z-30 flex gap-1">
        <button
          onClick={() => setPanelCollapsed(!panelCollapsed)}
          className="rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          title="Toggle panel"
        >
          {panelCollapsed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {/* Draggable Text Overlay */}
      {textOverlay.trim() && (
        <motion.div
          className={cn("absolute z-20 select-none text-center drop-shadow-2xl touch-none cursor-grab active:cursor-grabbing", fontClass)}
          style={{ left: `${textPos.x}%`, top: `${textPos.y}%`, transform: "translate(-50%, 0)" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {textBgColor !== "transparent" && (
            <span className="absolute -inset-x-2 -inset-y-1 rounded-lg" style={{ backgroundColor: textBgColor }} />
          )}
          <span className="relative" style={{ color: textColor, fontSize: `${textFontSize}px`, fontWeight: textFontWeight, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            {textOverlay}
          </span>
        </motion.div>
      )}

      {/* Drag hint */}
      {textOverlay.trim() && panelCollapsed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pointer-events-none absolute bottom-16 left-0 right-0 z-10 text-center">
          <span className="rounded-full bg-black/40 px-3 py-1 text-[10px] text-white/50 backdrop-blur-sm">
            Drag text to reposition
          </span>
        </motion.div>
      )}

      {/* Bottom Tools Panel */}
      {!createdStoryId && (
        <StoryCollapsiblePanel collapsed={panelCollapsed} onToggle={() => setPanelCollapsed(!panelCollapsed)}>
          <div className="space-y-3 px-3 pb-2">
            <div className="flex items-center gap-2">
              <Avatar size="sm" className="size-7">
                {user?.avatar ? <AvatarImage src={user.avatar} alt={user?.name} /> : null}
                <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-[10px] text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold text-white">{user?.name}</span>
            </div>

            <StoryInputWithEmoji
              value={textOverlay}
              onChange={setTextOverlay}
              placeholder="Add a caption..."
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
            {textOverlay.trim() && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Text Background</label>
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
            )}

            {/* Font Family */}
            {textOverlay.trim() && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Font</label>
                <div className="flex gap-1.5">
                  {fontFamilies.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFontFamily(f.value)}
                      className={cn("rounded-full px-4 py-1.5 text-xs font-semibold transition-all", fontFamily === f.value ? "bg-brand-teal text-white" : "bg-white/10 text-white/70 hover:bg-white/20", f.className)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Font Size */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white/70">Size</span>
              <div className="flex gap-1.5">
                {fontSizes.map((fs) => (
                  <button
                    key={fs.value}
                    onClick={() => setTextFontSize(fs.value)}
                    className={cn("flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all", textFontSize === fs.value ? "bg-brand-teal text-white" : "bg-white/10 text-white/70 hover:bg-white/20")}
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
                    className={cn("rounded-full px-4 py-1.5 text-xs font-semibold transition-all", textFontWeight === w ? "bg-brand-teal text-white" : "bg-white/10 text-white/70 hover:bg-white/20")}
                  >
                    {w === "bold" ? "Bold" : "Normal"}
                  </button>
                ))}
              </div>
            </div>

            {textOverlay.trim() && (
              <p className="text-center text-[10px] text-white/30">Collapse panel ↑ to drag text freely</p>
            )}

            <StoryPrivacySelector value={privacy} onChange={setPrivacy} />
          </div>

          <StoryActionButtons
            onCancel={onClose}
            onShare={handleShare}
            uploading={uploading}
            disabled={false}
            label="Share Story"
          />
        </StoryCollapsiblePanel>
      )}

      {createdStoryId && (
        <StoryHighlightPanel createdStoryId={createdStoryId} onClose={onClose} onCreated={onCreated} />
      )}
    </div>
  );
}
