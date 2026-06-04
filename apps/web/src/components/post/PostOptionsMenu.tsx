"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Bookmark,
  Link as LinkIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useDeletePostMutation, useToggleSaveMutation } from "@/redux/api/postApi";
import { toast } from "sonner";

export function PostOptionsMenu({
  postId,
  isOwner,
  onEdit,
}: {
  postId: string;
  isOwner: boolean;
  onEdit?: () => void;
}) {
  const [deletePost] = useDeletePostMutation();
  const [toggleSave, { isLoading: saving }] = useToggleSaveMutation();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    toast.success("Link copied to clipboard");
  };

  const handleDelete = () => {
    deletePost(postId);
    toast.success("Post deleted");
    setDeleteOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Post options"
          className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-[var(--bg-overlay)] hover:text-foreground active:scale-95 data-[state=open]:bg-[var(--bg-overlay)]"
        >
          <MoreHorizontal className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6} className="w-48">
          <DropdownMenuItem onSelect={handleCopyLink} className="cursor-pointer">
            <LinkIcon />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => toggleSave(postId)}
            disabled={saving}
            className="cursor-pointer"
          >
            <Bookmark />
            Save post
          </DropdownMenuItem>
          {isOwner && (
            <>
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onSelect={onEdit} className="cursor-pointer">
                  <Pencil />
                  Edit post
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setDeleteOpen(true);
                }}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="text-destructive" />
                Delete post
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <AlertTriangle className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post will be permanently removed from your profile
              and your followers&apos; feeds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2 />
              Delete post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
