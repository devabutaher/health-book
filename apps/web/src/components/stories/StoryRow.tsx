"use client";

import { useGetFriendsStoriesQuery } from "@/redux/api/storiesApi";
import { useStoryRealtime } from "@/hooks/useStoryRealtime";
import { motion } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import { StoryCircle } from "./StoryCircle";
import { StoryCreateButton } from "./StoryCreateButton";
import { StoryViewer } from "./StoryViewer";

export function StoryRow() {
  useStoryRealtime();
  const { data: groups, isLoading } = useGetFriendsStoriesQuery();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialIdx, setInitialIdx] = useState(0);
  const [showShadow, setShowShadow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkShadow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth;
    const hasMoreContent = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setShowShadow(hasOverflow && hasMoreContent);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkShadow();
    const observer = new ResizeObserver(checkShadow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [checkShadow]);

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
      {/* Fix: Create button sticky outside scroll, mask only on right side */}
      <div className="flex items-start gap-2">
        <div className="shrink-0">
          <StoryCreateButton onStoryCreated={() => {}} />
        </div>

        <div
          ref={scrollRef}
          onScroll={checkShadow}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
          style={
            showShadow
              ? {
                  maskImage: "linear-gradient(to right, black 85%, transparent)",
                  WebkitMaskImage: "linear-gradient(to right, black 85%, transparent)",
                }
              : undefined
          }
        >
          {isLoading ? (
            <div className="flex h-16 w-full items-center">
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full w-1/3 rounded-full bg-white/10"
                  animate={{ x: ["-100%", "300%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
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
