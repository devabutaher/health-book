"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import type { StoryGroup } from "@/types/story";
import { Type, HelpCircle, BarChart3 } from "lucide-react";

const typeIcons = {
  text: Type,
  quiz: HelpCircle,
  poll: BarChart3,
};

export function StoryCircle({
  group,
  storyMediaUrl,
  storyType,
  backgroundColor,
  onClick,
}: {
  group: StoryGroup;
  storyMediaUrl: string | null;
  storyType?: string;
  backgroundColor?: string | null;
  onClick: () => void;
}) {
  const hasUnseen = group.stories.some((s) => !s.viewed);
  const firstStory = group.stories[0];
  const type = storyType || firstStory?.type || "media";
  const bgColor = backgroundColor || firstStory?.backgroundColor || null;

  return (
    <button
      onClick={onClick}
      className="relative h-44 w-28 shrink-0 overflow-hidden rounded-2xl transition-transform active:scale-95"
    >
      {storyMediaUrl ? (
        <Image
          src={storyMediaUrl}
          alt={group.user.name}
          className="absolute inset-0 h-full w-full object-cover"
          width={112}
          height={176}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: bgColor || "#1a1a2e" }}
        >
          {type !== "media" && typeIcons[type as keyof typeof typeIcons] && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex size-10 items-center justify-center rounded-full bg-white/15"
            >
              {type === "text" && <Type className="size-5 text-white/80" />}
              {type === "quiz" && <HelpCircle className="size-5 text-white/80" />}
              {type === "poll" && <BarChart3 className="size-5 text-white/80" />}
            </motion.div>
          )}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
      <div
        className={`absolute left-2 top-2 rounded-full p-[2px] ${
          hasUnseen ? "bg-gradient-to-br from-brand-teal to-brand-green" : "bg-white/30"
        }`}
      >
        {hasUnseen && (
          <motion.div
            className="absolute -inset-1 rounded-full bg-gradient-to-br from-brand-teal/30 to-brand-green/30"
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <div className="relative rounded-full bg-black/40 p-[2px]">
          <Avatar size="sm" className="size-7">
            {group.user.avatar ? (
              <AvatarImage src={group.user.avatar} alt={group.user.name} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-[10px] text-white">
              {group.user.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      <span className="absolute bottom-2 left-2 right-2 truncate text-[11px] font-semibold text-white drop-shadow-lg">
        {group.user.name}
      </span>
    </button>
  );
}
