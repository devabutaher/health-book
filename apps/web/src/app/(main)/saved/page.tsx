"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, Bookmark } from "lucide-react";
import { motion } from "framer-motion";
import { PostCard } from "@/components/post/PostCard";
import { PostSkeleton } from "@/components/shared/PostSkeleton";
import { useGetSavedQuery } from "@/redux/api/postApi";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import type { Post } from "@/types/post";

export default function SavedPage() {
  const { data, isLoading, isError, refetch } = useGetSavedQuery({});
  const posts = (data?.data?.posts || data?.posts || []) as Post[];

  return (
    <div className="mx-auto max-w-[600px]">
      <Link
        href="/feed"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to feed
      </Link>

      <div className="mb-4 sm:mb-6 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-amber to-brand-coral shadow-[var(--shadow-glow-amber)]">
          <Bookmark className="size-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Saved Posts</h1>
          <p className="text-sm text-muted-foreground">
            {posts.length} {posts.length === 1 ? "post" : "posts"} saved
          </p>
        </div>
      </div>

      {isError ? (
        <Empty>
          <EmptyMedia variant="gradient">
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>Couldn&apos;t load saved posts</EmptyTitle>
          <EmptyDescription>Check your connection and try again.</EmptyDescription>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </Empty>
      ) : isLoading ? (
        <div className="flex flex-col gap-4">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <Empty>
          <EmptyMedia variant="gradient">
            <Bookmark />
          </EmptyMedia>
          <EmptyTitle>No saved posts</EmptyTitle>
          <EmptyDescription>Bookmark posts to view them here later.</EmptyDescription>
        </Empty>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col gap-4"
        >
          {posts.map((post) => (
            <motion.div key={post.id} variants={staggerItem}>
              <PostCard post={post} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
