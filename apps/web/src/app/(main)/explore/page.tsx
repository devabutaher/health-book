"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Compass, Newspaper } from "lucide-react";
import { motion } from "framer-motion";
import { PostCard } from "@/components/post/PostCard";
import { PostSkeletonList } from "@/components/shared/PostSkeleton";
import { useGetExploreQuery } from "@/redux/api/postApi";
import { useAppSelector } from "@/hooks";
import { useFeedPagination } from "@/hooks/useFeedPagination";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ExploreCategoryTabs } from "@/components/discovery/ExploreCategoryTabs";
import { HealthNewsFeed } from "@/components/discovery/HealthNewsFeed";
import { staggerContainer } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";
import type { Post } from "@/types/post";

export default function ExplorePage() {
  const [category, setCategory] = useState("all");
  const [tab, setTab] = useState<"posts" | "news">("posts");
  const isAuthLoading = useAppSelector((s) => s.auth.isLoading);
  const { cursor, allPosts, loadMore, applyPage } = useFeedPagination<Post>();
  const { data, isLoading, isFetching } = useGetExploreQuery(
    { cursor, category },
    { skip: isAuthLoading },
  );
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data?.data) return;
    applyPage(
      { posts: data.data.posts, nextCursor: data.data.nextCursor, hasMore: data.data.hasMore },
      Boolean(cursor),
    );
  }, [data, cursor, applyPage]);

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
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 sm:mb-6">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Explore</h1>
          <p className="text-sm text-muted-foreground">
            Discover health content from the community
          </p>
        </div>

        <div className="mb-3 sm:mb-4 flex gap-2">
          <button
            onClick={() => setTab("posts")}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
              tab === "posts"
                ? "bg-gradient-to-r from-brand-teal to-brand-green text-white shadow-[var(--shadow-glow-teal)]"
                : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]",
            )}
          >
            Posts
          </button>
          <button
            onClick={() => setTab("news")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
              tab === "news"
                ? "bg-gradient-to-r from-brand-teal to-brand-green text-white shadow-[var(--shadow-glow-teal)]"
                : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]",
            )}
          >
            <Newspaper className="size-3.5" /> News
          </button>
        </div>

        {tab === "news" ? (
          <HealthNewsFeed />
        ) : (
          <>
            <ExploreCategoryTabs active={category} onChange={setCategory} />

            {allPosts.length === 0 && !isLoading ? (
              <Empty>
                <EmptyMedia variant="gradient">
                  <Compass />
                </EmptyMedia>
                <EmptyTitle>Nothing to explore yet</EmptyTitle>
                <EmptyDescription>
                  New public posts will appear here. Check back soon.
                </EmptyDescription>
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

            {isLoading && (
              <div className="mt-4">
                <PostSkeletonList count={3} />
              </div>
            )}
            {isFetching && allPosts.length > 0 && (
              <p className="mt-4 text-center text-sm text-muted-foreground">Loading more...</p>
            )}

            <div ref={loaderRef} className="h-4" />
          </>
        )}
      </div>
  );
}
