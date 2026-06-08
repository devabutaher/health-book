"use client";

import { X, Shield, ShieldPlus, UserMinus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRemoveParticipantMutation, usePromoteToAdminMutation } from "@/redux/api/messagingApi";
import { toast } from "sonner";
import type { Conversation } from "@/types/conversation";

export function GroupMembersSheet({
  open,
  onClose,
  conversation,
  currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  conversation: Conversation;
  currentUserId?: string;
}) {
  const [removeParticipant, { isLoading: isRemoving }] = useRemoveParticipantMutation();
  const [promoteToAdmin, { isLoading: isPromoting }] = usePromoteToAdminMutation();

  const currentParticipant = conversation.participants.find((p) => p.userId === currentUserId);
  const isAdmin = currentParticipant?.role === "ADMIN";

  const handleRemove = async (userId: string) => {
    try {
      await removeParticipant({ conversationId: conversation.id, userId }).unwrap();
      toast.success("Participant removed");
    } catch {
      toast.error("Failed to remove participant");
    }
  };

  const handlePromote = async (userId: string) => {
    try {
      await promoteToAdmin({ conversationId: conversation.id, userId }).unwrap();
      toast.success("Member promoted to admin");
    } catch {
      toast.error("Failed to promote member");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} aria-describedby={undefined}>
        <DialogTitle className="sr-only">Group Members</DialogTitle>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
            Members ({conversation.participants.length})
          </h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {conversation.participants.map((p) => (
            <div key={p.userId} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <Avatar size="sm" className="size-9">
                {p.user.avatar ? <AvatarImage src={p.user.avatar} alt={p.user.name} /> : null}
                <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-xs text-white">
                  {p.user.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {p.user.name}
                  {p.userId === currentUserId && (
                    <span className="ml-1 text-xs text-[var(--text-muted)]">(you)</span>
                  )}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">@{p.user.username}</p>
              </div>
              {p.role === "ADMIN" && <Shield className="size-4 text-brand-teal" />}
              {isAdmin && p.userId !== currentUserId && p.role !== "ADMIN" && (
                <button
                  onClick={() => handlePromote(p.userId)}
                  disabled={isPromoting}
                  title="Make admin"
                  className="flex size-8 items-center justify-center rounded-xl text-amber-400 transition-colors hover:bg-amber-500/10"
                >
                  <ShieldPlus className="size-4" />
                </button>
              )}
              {isAdmin && p.userId !== currentUserId && (
                <button
                  onClick={() => handleRemove(p.userId)}
                  disabled={isRemoving}
                  className="flex size-8 items-center justify-center rounded-xl text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <UserMinus className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
