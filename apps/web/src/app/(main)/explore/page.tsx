"use client";

import { ExploreCategoryTabs } from "@/components/discovery/ExploreCategoryTabs";
import { HealthNewsFeed } from "@/components/discovery/HealthNewsFeed";
import { PostCard } from "@/components/post/PostCard";
import { PostSkeletonList } from "@/components/shared/PostSkeleton";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useAppSelector } from "@/hooks";
import { useFeedPagination } from "@/hooks/useFeedPagination";
import { cn } from "@/lib/utils";
import { useGetExploreQuery } from "@/redux/api/postApi";
import type { Post } from "@/types/post";
import { AlertCircle, Compass, Newspaper } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";

export default function ExplorePage() {
  const [category, setCategory] = useState("all");
  const [tab, setTab] = useState<"posts" | "news">("posts");
  const isAuthLoading = useAppSelector((s) => s.auth.isLoading);
  const { cursor, allPosts, loadMore, applyPage } = useFeedPagination<Post>();
  const { data, isLoading, isFetching, isError, refetch } = useGetExploreQuery(
    { cursor, category },
    { skip: isAuthLoading },
  );

  const appliedCursors = useRef(new Set<string | undefined>());
  const prevCategory = useRef(category);

  useEffect(() => {
    if (prevCategory.current === category) return;
    prevCategory.current = category;
    appliedCursors.current.clear();
  }, [category]);

  useEffect(() => {
    if (!data?.data) return;
    if (appliedCursors.current.has(cursor)) return;
    appliedCursors.current.add(cursor);
    applyPage(
      { posts: data.data.posts, nextCursor: data.data.nextCursor, hasMore: data.data.hasMore },
      Boolean(cursor),
    );
  }, [data, cursor, applyPage]);

  const isFetchingRef = useRef(isFetching);
  const hasMoreRef = useRef<boolean>(false);
  const cursorRef = useRef<string | null>(null);

  useEffect(() => {
    isFetchingRef.current = isFetching;
    hasMoreRef.current = data?.data?.hasMore ?? false;
    cursorRef.current = data?.data?.nextCursor ?? null;
  }, [isFetching, data?.data?.hasMore, data?.data?.nextCursor]);

  const endReached = useCallback(() => {
    if (hasMoreRef.current && cursorRef.current && !isFetchingRef.current) {
      loadMore(cursorRef.current);
    }
  }, [loadMore]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 sm:mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Explore</h1>
        <p className="text-sm text-muted-foreground">Discover health content from the community</p>
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

          {isError ? (
            <Empty>
              <EmptyMedia variant="gradient">
                <AlertCircle />
              </EmptyMedia>
              <EmptyTitle>Couldn&apos;t load explore</EmptyTitle>
              <EmptyDescription>Check your connection and try again.</EmptyDescription>
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </Empty>
          ) : allPosts.length === 0 && !isLoading ? (
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
            <Virtuoso
              useWindowScroll
              data={allPosts}
              endReached={endReached}
              increaseViewportBy={400}
              overscan={200}
              itemContent={(index, post) => (
                <div key={post.id} className="pb-4">
                  <PostCard post={post} />
                </div>
              )}
              components={{
                Header: () => <div className="pb-4" />,
                Footer: () => (
                  <>
                    {isFetching && allPosts.length > 0 && (
                      <p className="mb-4 text-center text-sm text-muted-foreground">
                        Loading more...
                      </p>
                    )}
                  </>
                ),
              }}
            />
          )}

          {isLoading && (
            <div className="mt-4">
              <PostSkeletonList count={3} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
