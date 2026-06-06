"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { FileText, Plus, Users } from "lucide-react";
import { motion } from "framer-motion";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { PostCard } from "@/components/post/PostCard";
import { CreatePostModal } from "@/components/post/CreatePostModal";
import { DraftsDialog } from "@/components/post/DraftsDialog";
import { StoryRow } from "@/components/stories/StoryRow";
import { PostSkeletonList } from "@/components/shared/PostSkeleton";
import { useGetDraftsQuery, useGetFeedQuery } from "@/redux/api/postApi";
import { useAppSelector } from "@/hooks";
import { useFeedPagination } from "@/hooks/useFeedPagination";
import type { Post } from "@/types/post";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { staggerContainer } from "@/lib/motion/variants";
import { FeatureDiscoveryCards } from "@/components/shared/FeatureDiscoveryCards";
import { MobilePeoplePanel } from "@/components/shared/MobilePeoplePanel";

export default function FeedPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const { data: draftsData } = useGetDraftsQuery();
  const draftCount = Array.isArray(draftsData)
    ? draftsData.length
    : ((draftsData as { data?: unknown[] } | undefined)?.data?.length ?? 0);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const { cursor, allPosts, loadMore, applyPage, reset } = useFeedPagination<Post>();
  const { data, isLoading, isFetching, isError, refetch } = useGetFeedQuery(
    { cursor },
    { skip: !accessToken },
  );
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data?.data) return;
    applyPage(
      { posts: data.data.posts, nextCursor: data.data.nextCursor, hasMore: data.data.hasMore },
      Boolean(cursor),
    );
  }, [data, cursor, applyPage]);

  const handlePostCreated = useCallback(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    const handler = () => {
      reset();
      refetch();
    };
    window.addEventListener("app:pulltorefresh", handler);
    return () => window.removeEventListener("app:pulltorefresh", handler);
  }, [reset, refetch]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && data?.data?.hasMore && !isFetching && data.data.nextCursor) {
        loadMore(data.data.nextCursor);
      }
    },
    [data, isFetching, loadMore],
  );

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">Your Feed</h1>
            <p className="text-sm text-muted-foreground">Latest from people you follow</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="gradient" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus />
              <span className="hidden sm:inline">New post</span>
            </Button>
            <Button variant="outline" onClick={() => setDraftsOpen(true)} className="gap-1.5">
              <FileText className="size-4" />
              <span className="hidden sm:inline">Drafts</span>
              {draftCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-brand-teal text-[11px] font-bold text-white">
                  {draftCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <StoryRow />
        </div>

        <MobilePeoplePanel />

        <FeatureDiscoveryCards />

        {!accessToken || isLoading ? (
          <PostSkeletonList count={3} />
        ) : isError && allPosts.length === 0 ? (
          <Empty>
            <EmptyMedia variant="gradient">
              <Users />
            </EmptyMedia>
            <EmptyTitle>Couldn&apos;t load your feed</EmptyTitle>
            <EmptyDescription>Check your connection and try again.</EmptyDescription>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </Empty>
        ) : allPosts.length === 0 ? (
          <Empty>
            <EmptyMedia variant="gradient">
              <Users />
            </EmptyMedia>
            <EmptyTitle>Your feed is empty</EmptyTitle>
            <EmptyDescription>
              Follow some people to see their posts here, or share your own health journey.
            </EmptyDescription>
            <Button variant="gradient" onClick={() => setCreateOpen(true)}>
              <Plus /> Share your first post
            </Button>
          </Empty>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="flex flex-col gap-4"
          >
            {allPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </motion.div>
        )}

        {isError && allPosts.length > 0 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">Error loading more posts</p>
        )}
        {isFetching && allPosts.length > 0 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">Loading more...</p>
        )}

        <div ref={loaderRef} className="h-4" />
      </div>

      <CreatePostModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handlePostCreated}
      />
      <DraftsDialog open={draftsOpen} onClose={() => setDraftsOpen(false)} />
    </ProtectedRoute>
  );
}
