"use client";

import { motion } from "framer-motion";
import { Image, Type, BarChart3, HelpCircle, X } from "lucide-react";

export function StoryCreationPicker({
  onSelect,
  onClose,
}: {
  onSelect: (type: "media" | "text" | "quiz" | "poll") => void;
  onClose: () => void;
}) {
  const options: {
    type: "media" | "text" | "quiz" | "poll";
    icon: typeof Image;
    label: string;
    desc: string;
  }[] = [
    {
      type: "media",
      icon: Image,
      label: "Upload Photo/Video",
      desc: "Share a moment with your friends",
    },
    { type: "text", icon: Type, label: "Text Story", desc: "Express yourself with text on color" },
    { type: "quiz", icon: HelpCircle, label: "Create Quiz", desc: "Test your friends' knowledge" },
    { type: "poll", icon: BarChart3, label: "Create Poll", desc: "Get your friends' opinions" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-sm rounded-2xl bg-[#111] p-6"
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white"
        >
          <X className="size-4" />
        </button>

        <h2 className="mb-1 text-center text-lg font-bold text-white">Create a Story</h2>
        <p className="mb-5 text-center text-sm text-white/50">Choose how you want to share</p>

        <div className="space-y-3">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.type}
                onClick={() => onSelect(opt.type)}
                className="flex w-full items-center gap-4 rounded-xl bg-white/5 p-4 text-left transition-colors hover:bg-white/10"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-teal to-brand-green">
                  <Icon className="size-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{opt.label}</p>
                  <p className="text-sm text-white/50">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
