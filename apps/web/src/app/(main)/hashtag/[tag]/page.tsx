"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Hash, SearchX } from "lucide-react";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { PostCard } from "@/components/post/PostCard";
import { PostSkeletonList } from "@/components/shared/PostSkeleton";
import { useSearchPostsQuery, useGetRelatedHashtagsQuery } from "@/redux/api/searchApi";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { Post } from "@/types/post";

export default function HashtagPage() {
  const { tag } = useParams<{ tag: string }>();
  const { data, isLoading } = useSearchPostsQuery({ q: `#${tag}` }, { skip: !tag });
  const { data: relatedTags, isLoading: relatedLoading } = useGetRelatedHashtagsQuery(tag, {
    skip: !tag,
  });
  const posts = data?.posts || [];

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-[600px]">
        <Link
          href="/explore"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to explore
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-teal to-brand-green shadow-[var(--shadow-glow-teal)]">
            <Hash className="size-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">#{tag}</h1>
            <p className="text-sm text-muted-foreground">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </p>
          </div>
        </div>

        {relatedTags && relatedTags.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Related Hashtags</h2>
            <div className="flex flex-wrap gap-2">
              {relatedTags.map((t) => (
                <Link
                  key={t.tag}
                  href={`/hashtag/${encodeURIComponent(t.tag.replace("#", ""))}`}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--glass-border)] bg-[var(--bg-overlay)] px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-brand-teal/30 hover:text-brand-teal"
                >
                  {t.tag} <span className="text-[10px] opacity-60">{t.count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {relatedLoading && (
          <div className="mb-6 flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        )}

        {isLoading ? (
          <PostSkeletonList count={3} />
        ) : posts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {posts.map((post: Post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <Empty>
            <EmptyMedia variant="gradient">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>No posts for #{tag}</EmptyTitle>
            <EmptyDescription>Be the first to use this hashtag.</EmptyDescription>
          </Empty>
        )}
      </div>
    </ProtectedRoute>
  );
}
