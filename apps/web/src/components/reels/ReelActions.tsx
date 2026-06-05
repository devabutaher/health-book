"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  useDeleteReelMutation,
  useUpdateReelMutation,
} from "@/redux/api/reelsApi";
import { Heart, Loader2, MessageCircle, MoreVertical, Pencil, Share2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ReelActions({
  reelId,
  currentCaption,
  initialLiked,
  initialLikesCount,
  commentsCount,
  isOwner,
  onLikeToggle,
  onCommentClick,
  onDelete,
  onCaptionUpdate,
}: {
  reelId: string;
  currentCaption?: string | null;
  initialLiked: boolean;
  initialLikesCount: number;
  commentsCount: number;
  isOwner?: boolean;
  onLikeToggle?: () => void;
  onCommentClick?: () => void;
  onDelete?: () => void;
  onCaptionUpdate?: (caption: string | null) => void;
}) {
  const [deleteReel, { isLoading: deleting }] = useDeleteReelMutation();
  const [updateReel, { isLoading: updating }] = useUpdateReelMutation();
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentCaption || "");

  useEffect(() => {
    setLiked(initialLiked);
    setLikesCount(initialLikesCount);
  }, [initialLiked, initialLikesCount]);

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => (next ? c + 1 : c - 1));
    onLikeToggle?.();
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/reels/${reelId}`);
    toast.success("Link copied!");
  };

  const handleDelete = async () => {
    try {
      await deleteReel(reelId).unwrap();
      toast.success("Reel deleted");
      onDelete?.();
    } catch {
      toast.error("Failed to delete reel");
    }
  };

  const handleEdit = () => {
    setEditValue(currentCaption || "");
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const trimmed = editValue.trim();
      await updateReel({ reelId, caption: trimmed || undefined }).unwrap();
      toast.success("Caption updated");
      setEditing(false);
      onCaptionUpdate?.(trimmed || null);
    } catch {
      toast.error("Failed to update caption");
    }
  };

  return (
    <>
      <div className="absolute right-3 top-0 bottom-24 z-20 flex flex-col items-center justify-end gap-4">
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex size-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="size-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4}>
              <DropdownMenuItem onSelect={handleEdit}>
                <Pencil className="size-4 mr-2" />
                Edit caption
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleDelete}
                disabled={deleting}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="size-4 mr-2" />
                {deleting ? "Deleting..." : "Delete reel"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <button
          onClick={handleLike}
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl transition-transform active:scale-110"
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart
            className={cn(
              "size-7 drop-shadow-lg transition-colors",
              liked ? "fill-red-500 text-red-500" : "text-white",
            )}
          />
          <span className="text-[10px] font-semibold text-white">{likesCount.toLocaleString()}</span>
        </button>

        <button
          onClick={onCommentClick}
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl transition-transform active:scale-90"
          aria-label="Comments"
        >
          <MessageCircle className="size-7 text-white drop-shadow-lg" />
          <span className="text-[10px] font-semibold text-white">{commentsCount.toLocaleString()}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl transition-transform active:scale-90"
          aria-label="Share"
        >
          <Share2 className="size-6 text-white drop-shadow-lg" />
        </button>
      </div>

      {editing && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setEditing(false);
              setEditValue(currentCaption || "");
            }}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 z-50 flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full flex-col rounded-t-2xl bg-[var(--bg-elevated)] p-4 shadow-2xl">
              <h3 className="text-sm font-bold text-white">Edit caption</h3>
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                maxLength={2000}
                rows={3}
                className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
                placeholder="Edit caption..."
                autoFocus
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-white/40">{editValue.length}/2000</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditValue(currentCaption || "");
                    }}
                    className="rounded-xl px-4 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={updating}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-teal to-brand-green px-4 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-50"
                  >
                    {updating && <Loader2 className="size-3.5 animate-spin" />}
                    {updating ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </>
  );
}
