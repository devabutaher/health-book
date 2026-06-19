"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import { FileText, Plus, Users, LogIn, LogOut } from "lucide-react";
import { Virtuoso } from "react-virtuoso";
import { PostCard } from "@/components/post/PostCard";
import { PostSkeletonList } from "@/components/shared/PostSkeleton";
import { useGetDraftsQuery, useGetFeedQuery } from "@/redux/api/postApi";
import { useAppSelector, useAppDispatch } from "@/hooks";
import { mergePage, setCursor, reset as resetFeed } from "@/redux/slices/feedSlice";
import type { Post } from "@/types/post";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { MobilePeoplePanel } from "@/components/shared/MobilePeoplePanel";
import Link from "next/link";

class PostCardErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <p className="p-4 text-center text-sm text-muted-foreground">Failed to load post</p>;
    }
    return this.props.children;
  }
}

const CreatePostModal = dynamic(
  () => import("@/components/post/CreatePostModal").then((m) => ({ default: m.CreatePostModal })),
  { ssr: false },
);
const DraftsDialog = dynamic(
  () => import("@/components/post/DraftsDialog").then((m) => ({ default: m.DraftsDialog })),
  { ssr: false },
);
const StoryRow = dynamic(() =>
  import("@/components/stories/StoryRow").then((m) => ({ default: m.StoryRow })),
);
const FeatureDiscoveryCards = dynamic(() =>
  import("@/components/shared/FeatureDiscoveryCards").then((m) => ({
    default: m.FeatureDiscoveryCards,
  })),
);

export default function FeedPage() {
  const dispatch = useAppDispatch();
  const [createOpen, setCreateOpen] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const { data: draftsData } = useGetDraftsQuery();
  const draftCount = Array.isArray(draftsData)
    ? draftsData.length
    : ((draftsData as { data?: unknown[] } | undefined)?.data?.length ?? 0);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const authLoading = useAppSelector((s) => s.auth.isLoading);
  const cursor = useAppSelector((s) => s.feed.cursor);
  const allPosts = useAppSelector((s) => s.feed.allPosts);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetFeedQuery(
    { cursor },
    { skip: !accessToken },
  );
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const isFetchingRef = useRef(isFetching);
  const hasMoreRef = useRef<boolean | undefined>(data?.data?.hasMore);
  const cursorRef = useRef<string | null | undefined>(data?.data?.nextCursor);

  useEffect(() => {
    isFetchingRef.current = isFetching;
    hasMoreRef.current = data?.data?.hasMore ?? false;
    cursorRef.current = data?.data?.nextCursor ?? null;
  }, [isFetching, data?.data?.hasMore, data?.data?.nextCursor]);

  const isAuthError = error && "status" in error && error.status === 401;

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setLoadingTimedOut(true), 15000);
    return () => {
      clearTimeout(timer);
      setLoadingTimedOut(false);
    };
  }, [isLoading]);

  const appendRef = useRef(false);
  useEffect(() => {
    if (!data?.data) return;
    dispatch(
      mergePage({
        posts: data.data.posts as Post[],
        cursor: data.data.nextCursor as string | undefined,
        hasMore: data.data.hasMore ?? false,
        append: appendRef.current,
      }),
    );
    appendRef.current = true;
  }, [data, dispatch]);

  const wrappedReset = useCallback(() => {
    appendRef.current = false;
    dispatch(resetFeed());
  }, [dispatch]);

  const handlePostCreated = useCallback(() => {
    wrappedReset();
  }, [wrappedReset]);

  useEffect(() => {
    const handler = () => {
      wrappedReset();
      refetch();
    };
    window.addEventListener("app:pulltorefresh", handler);
    return () => window.removeEventListener("app:pulltorefresh", handler);
  }, [wrappedReset, refetch]);

  const endReached = useCallback(() => {
    if (hasMoreRef.current && cursorRef.current && !isFetchingRef.current) {
      dispatch(setCursor(cursorRef.current));
    }
  }, [dispatch]);

  return (
    <>
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">Your Feed</h1>
            <p className="text-sm text-muted-foreground">Discover health posts from the community</p>
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

        {authLoading ? (
          <PostSkeletonList count={3} />
        ) : !accessToken ? (
          <Empty>
            <EmptyMedia variant="gradient">
              <LogIn />
            </EmptyMedia>
            <EmptyTitle>Sign in to see your feed</EmptyTitle>
            <EmptyDescription>
              Log in to follow people and see their health journey posts.
            </EmptyDescription>
            <Link href="/login">
              <Button variant="gradient">
                <LogIn /> Sign In
              </Button>
            </Link>
          </Empty>
        ) : isLoading && !loadingTimedOut && allPosts.length === 0 ? (
          <PostSkeletonList count={3} />
        ) : (isError || loadingTimedOut) && allPosts.length === 0 ? (
          <Empty>
            <EmptyMedia variant="gradient">{isAuthError ? <LogOut /> : <Users />}</EmptyMedia>
            <EmptyTitle>
              {isAuthError ? "Session expired" : "Couldn&apos;t load your feed"}
            </EmptyTitle>
            <EmptyDescription>
              {isAuthError
                ? "Your session has expired. Please log in again to continue."
                : "Check your connection and try again."}
            </EmptyDescription>
            {isAuthError ? (
              <Link href="/login">
                <Button variant="gradient">
                  <LogIn /> Log in
                </Button>
              </Link>
            ) : (
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            )}
          </Empty>
        ) : allPosts.length === 0 ? (
          <Empty>
            <EmptyMedia variant="gradient">
              <Users />
            </EmptyMedia>
            <EmptyTitle>No posts yet</EmptyTitle>
            <EmptyDescription>
              Be the first to share your health journey with the community.
            </EmptyDescription>
            <Button variant="gradient" onClick={() => setCreateOpen(true)}>
              <Plus /> Share your first post
            </Button>
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
                <PostCardErrorBoundary>
                  <PostCard post={post} />
                </PostCardErrorBoundary>
              </div>
            )}
            components={{
              Footer: () => (
                <>
                  {isError && allPosts.length > 0 && (
                    <p className="mb-4 text-center text-sm text-muted-foreground">
                      Error loading more posts
                    </p>
                  )}
                  {isFetching && allPosts.length > 0 && (
                    <div className="mb-4 flex justify-center">
                      <div className="size-5 animate-spin rounded-full border-2 border-brand-teal border-t-transparent" />
                    </div>
                  )}
                </>
              ),
            }}
          />
        )}
      </div>

      <CreatePostModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handlePostCreated}
      />
      <DraftsDialog open={draftsOpen} onClose={() => setDraftsOpen(false)} />
    </>
  );
}
