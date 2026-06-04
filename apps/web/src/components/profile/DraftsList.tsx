"use client";

import { useState } from "react";
import { CalendarClock, FileText, Loader2, Trash2 } from "lucide-react";
import {
  useGetDraftsQuery,
  usePublishDraftMutation,
  useDeletePostMutation,
} from "@/redux/api/postApi";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { toast } from "sonner";
import { PostCard } from "@/components/post/PostCard";
import { CreatePostModal } from "@/components/post/CreatePostModal";
import type { Post } from "@/types/post";

export function DraftsList() {
  const { data: drafts, isLoading } = useGetDraftsQuery();
  const [publishDraft, { isLoading: publishing }] = usePublishDraftMutation();
  const [deletePost] = useDeletePostMutation();
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const draftList: Post[] = Array.isArray(drafts)
    ? drafts
    : ((drafts as { data: Post[] } | undefined)?.data ?? []);

  const handlePublish = async (id: string) => {
    try {
      await publishDraft(id).unwrap();
      toast.success("Post published!");
    } catch {
      toast.error("Failed to publish post");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePost(id).unwrap();
      toast.success("Draft deleted");
    } catch {
      toast.error("Failed to delete draft");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (draftList.length === 0) {
    return (
      <Empty>
        <EmptyMedia variant="gradient">
          <FileText />
        </EmptyMedia>
        <EmptyTitle>No drafts</EmptyTitle>
        <EmptyDescription>Drafts you save will appear here.</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {draftList.map((draft) => (
        <div key={draft.id} className="relative">
          <PostCard post={draft} />
          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              variant="gradient"
              onClick={() => handlePublish(draft.id)}
              disabled={publishing}
            >
              {publishing && <Loader2 className="size-3 animate-spin" />}
              Publish now
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditingPost(draft)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(draft.id)}
              className="text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
            {draft.scheduledAt && (
              <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarClock className="size-3" />
                Scheduled: {new Date(draft.scheduledAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      ))}
      {editingPost && (
        <CreatePostModal
          open={true}
          onClose={() => setEditingPost(null)}
          initialPost={{
            id: editingPost.id,
            content: editingPost.content || "",
            privacy: editingPost.privacy,
          }}
        />
      )}
    </div>
  );
}
