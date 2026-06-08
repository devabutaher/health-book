"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Video } from "lucide-react";
import { StoryCircle } from "@/components/stories/StoryCircle";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { StoryCreateButton } from "@/components/stories/StoryCreateButton";
import { useGetFriendsStoriesQuery } from "@/redux/api/storiesApi";
import { useStoryRealtime } from "@/hooks/useStoryRealtime";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function StoriesPage() {
  useStoryRealtime();
  const { data: groups, isLoading, isError, refetch } = useGetFriendsStoriesQuery();
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
    <div className="mx-auto max-w-[600px]">
      <Link
        href="/feed"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to feed
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink shadow-[var(--shadow-glow-purple)]">
          <Video className="size-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Stories</h1>
          <p className="text-sm text-muted-foreground">
            {activeGroups?.length
              ? `${activeGroups.length} friends with stories`
              : "No stories available"}
          </p>
        </div>
      </div>

      {isError ? (
        <Empty>
          <EmptyMedia variant="gradient">
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>Couldn&apos;t load stories</EmptyTitle>
          <EmptyDescription>Check your connection and try again.</EmptyDescription>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </Empty>
      ) : isLoading ? (
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-44 w-28 rounded-2xl" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      ) : !activeGroups?.length ? (
        <Empty>
          <EmptyMedia variant="gradient">
            <Video />
          </EmptyMedia>
          <EmptyTitle>No stories to show</EmptyTitle>
          <EmptyDescription>
            Stories from your friends will appear here for 24 hours.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="mb-4 font-display text-base font-bold">Create a Story</h2>
            <StoryCreateButton />
          </div>

          <div className="border-t border-[var(--border-subtle)] pt-6">
            <h2 className="mb-4 font-display text-base font-bold">Recent Stories</h2>
            <div className="flex flex-wrap gap-4">
              {activeGroups.map((group, idx) => (
                <div key={group.user.id} className="flex flex-col items-center gap-1">
                  <StoryCircle
                    group={group}
                    storyMediaUrl={group.stories[0]?.mediaUrl}
                    onClick={() => handleStoryClick(idx)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {group.user.name.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewerOpen && activeGroups && (
        <StoryViewer
          groups={activeGroups}
          initialIndex={initialIdx}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}
