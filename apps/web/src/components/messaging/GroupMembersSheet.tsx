"use client";

import { X, Shield, ShieldPlus, UserMinus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useRemoveParticipantMutation,
  usePromoteToAdminMutation,
} from "@/redux/api/messagingApi";
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
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="relative w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] sm:mx-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
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
            <div className="max-h-80 overflow-y-auto p-2">
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
