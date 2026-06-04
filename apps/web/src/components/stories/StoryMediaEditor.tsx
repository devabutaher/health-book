"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppSelector } from "@/hooks";
import { cn } from "@/lib/utils";
import { useAddHighlightItemMutation, useGetHighlightsQuery } from "@/redux/api/highlightsApi";
import { useCreateStoryMutation } from "@/redux/api/storiesApi";
import { motion } from "framer-motion";
import { Send, X, Eye, EyeOff, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
  const [previewMode, setPreviewMode] = useState(false);
  const [privacy, setPrivacy] = useState<"public" | "friends" | "private">("public");

  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string>("");
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [duration, setDuration] = useState<number>(0);

  const [createStory] = useCreateStoryMutation();
  const { data: highlights } = useGetHighlightsQuery();
  const [addHighlightItem] = useAddHighlightItemMutation();
  const [createdStoryId, setCreatedStoryId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(
    null,
  );

  useEffect(() => {
    if (!file) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    try {
      const formData = new FormData();
      formData.append("image", file);

      const mediaRes = await fetch(`${process.env["NEXT_PUBLIC_API_URL"]}/api/posts/media`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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
        textFontSize: textOverlay.trim() ? textFontSize : undefined,
        textFontWeight: textOverlay.trim() ? textFontWeight : undefined,
        textPosition: textOverlay.trim() ? JSON.stringify(textPos) : undefined,
      }).unwrap();

      setCreatedStoryId(story.id);
      toast.success("Story shared!");
    } catch (error) {
      console.error("Error:", error);
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
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
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
        {/* Media Preview */}
        {localPreview ? (
          mediaType === "video" ? (
            <video
              ref={videoRef}
              src={localPreview}
              className="h-full w-full object-contain"
              autoPlay
              playsInline
              muted
              loop
            />
          ) : (
            <Image
              src={localPreview}
              alt="Story media preview"
              className="h-full w-full object-contain"
              width={400}
              height={712}
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black/50">
            <div className="size-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}

        {/* Phone bezel border */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/10" />

        {/* "Your Story" label */}
        <div className="absolute left-3 top-3 z-10">
          <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-medium text-white/60 backdrop-blur-sm">
            Your Story
          </span>
        </div>

        {/* Text Overlay */}
        {textOverlay.trim() && (
          <motion.div
            className={cn(
              "absolute z-10 select-none text-center drop-shadow-2xl",
              fontFamilies.find((f) => f.value === fontFamily)?.className,
            )}
            style={{
              left: `${textPos.x}%`,
              top: `${textPos.y}%`,
              transform: "translate(-50%, 0)",
              cursor: "grab",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
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
              {textOverlay}
            </span>
          </motion.div>
        )}

        {/* Top right buttons */}
        <div className="absolute right-3 top-3 z-30 flex gap-1">
          {textOverlay.trim() && (
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

        {/* Tap preview area */}
        {previewMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
              {/* User info */}
              <div className="flex items-center gap-2">
                <Avatar size="sm" className="size-7">
                  {user?.avatar ? <AvatarImage src={user.avatar} alt={user?.name} /> : null}
                  <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-[10px] text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-white">{user?.name}</span>
              </div>

              {/* Text Input + Emoji */}
              <div className="relative">
                <input
                  value={textOverlay}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  placeholder="Add a caption..."
                  maxLength={200}
                  className="w-full rounded-xl bg-white/15 px-4 py-3 pr-20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
                  <button
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="rounded-full p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Smile className="size-4" />
                  </button>
                  {textOverlay && (
                    <span className="text-xs text-white/50">{textOverlay.length}/200</span>
                  )}
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

              {/* Text Background */}
              {textOverlay.trim() && (
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
              )}

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
              <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
                <span className="text-[10px] text-white/40">
                  {previewMode ? "" : "Tap Preview to drag text to any position"}
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
                disabled={uploading}
                className="flex-1 rounded-full bg-gradient-to-r from-brand-teal to-brand-green py-3 font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Uploading...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Send className="size-4" />
                    Share Story
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
