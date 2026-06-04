"use client";

import { useState, useRef } from "react";
import NextImage from "next/image";
import { Image as ImageIcon, Send, X, Loader2 } from "lucide-react";
import { useAppSelector } from "@/hooks";

export function ChatInput({ onSend }: { onSend: (content: string, mediaUrl?: string) => void }) {
  const [text, setText] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accessToken = useAppSelector((s) => s.auth.accessToken);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !mediaPreview) return;
    onSend(trimmed || "", mediaPreview || undefined);
    setText("");
    setMediaPreview(null);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${process.env["NEXT_PUBLIC_API_URL"]}/api/posts/media`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Upload failed");

      setMediaPreview(json.data.url);
    } catch {
      setMediaPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border-t border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 pb-[env(safe-area-inset-bottom)]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {mediaPreview && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-[var(--bg-subtle)] p-2">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
            <NextImage
              src={mediaPreview}
              alt="Preview"
              className="size-full object-cover"
              width={48}
              height={48}
            />
          </div>
          <span className="truncate text-xs text-[var(--text-secondary)]">Image ready to send</span>
          <button
            onClick={() => setMediaPreview(null)}
            className="ml-auto flex size-6 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label="Attach image"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-overlay)] hover:text-[var(--text-secondary)] disabled:opacity-40"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImageIcon className="size-5" />
          )}
        </button>

        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Type a message..."
            rows={1}
            disabled={uploading}
            className="w-full resize-none rounded-xl bg-[var(--bg-subtle)] flex items-center px-4 py-2.5 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-brand-teal/20 disabled:opacity-50"
            style={{ minHeight: 40, maxHeight: 120 }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={(!text.trim() && !mediaPreview) || uploading}
          aria-label="Send message"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-brand-teal to-brand-green text-white shadow-[var(--shadow-glow-teal)] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
