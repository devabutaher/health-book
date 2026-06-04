"use client";

import { useState } from "react";
import { StoryCircle } from "./StoryCircle";
import { StoryCreateButton } from "./StoryCreateButton";
import { StoryViewer } from "./StoryViewer";
import { useGetFriendsStoriesQuery } from "@/redux/api/storiesApi";
import { motion } from "framer-motion";

function SkeletonCard() {
  return (
    <div className="relative h-44 w-28 shrink-0 overflow-hidden rounded-2xl bg-white/5">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute left-2 top-2 size-8 rounded-full bg-white/10" />
      <div className="absolute bottom-3 left-2 right-2 h-3 rounded bg-white/10" />
    </div>
  );
}

export function StoryRow() {
  const { data: groups, isLoading } = useGetFriendsStoriesQuery();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialIdx, setInitialIdx] = useState(0);

  const activeGroups = groups
    ?.map((group) => ({
      ...group,
      stories: group.stories.filter((s) => new Date(s.expiresAt) > new Date()),
    }))
    .filter((group) => group.stories.length > 0);

  const handleStoryClick = (idx: number) => {
    setInitialIdx(idx);
    setViewerOpen(true);
  };

  return (
    <>
      <div
        className="flex gap-2 overflow-x-auto px-0 pb-2 scrollbar-none"
        style={{
          maskImage: "linear-gradient(to right, black 90%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, black 90%, transparent)",
        }}
      >
        <StoryCreateButton onStoryCreated={() => {}} />
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          activeGroups?.map((group, idx) => (
            <StoryCircle
              key={group.user.id}
              group={group}
              storyMediaUrl={group.stories[0]?.mediaUrl}
              storyType={group.stories[0]?.type}
              backgroundColor={group.stories[0]?.backgroundColor}
              onClick={() => handleStoryClick(idx)}
            />
          ))
        )}
      </div>

      {viewerOpen && activeGroups && (
        <StoryViewer
          groups={activeGroups}
          initialIndex={initialIdx}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
