"use client";

import { ActiveNow } from "@/components/shared/ActiveNow";
import { ConversationList } from "@/components/messaging/ConversationList";
import { NewConversationModal } from "@/components/messaging/NewConversationModal";
import { GlassCard } from "@/components/ui/glass-card";
import { useAppSelector } from "@/hooks";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useConversationRealtime } from "@/hooks/useConversationRealtime";
import { MessageCircle, PenLine, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function MessagesPage() {
  const router = useRouter();
  const userId = useAppSelector((s) => s.auth.user?.id);
  const [newConvoOpen, setNewConvoOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  useUnreadCount();
  useConversationRealtime();

  return (
    <>
      <GlassCard
        variant="elevated"
        className="mx-auto flex h-[calc(100vh-10rem)] max-w-5xl overflow-hidden! rounded-2xl md:h-[calc(100vh-8rem)]"
      >
        <div className="flex w-full flex-col border-r border-[var(--border-default)] lg:w-96">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
            <h1 className="font-display text-lg font-bold text-[var(--text-primary)]">Messages</h1>
            <div className="flex items-center gap-1">
              <button
                aria-label="New group"
                onClick={() => setNewGroupOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-amber to-brand-coral px-3 py-2 text-xs font-semibold text-white shadow-[var(--shadow-glow-amber)] transition-transform hover:scale-105 active:scale-95"
              >
                <Users className="size-3.5" />
                New Group
              </button>
              <button
                aria-label="New message"
                onClick={() => setNewConvoOpen(true)}
                className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-r from-brand-teal to-brand-green text-white shadow-[var(--shadow-glow-teal)] transition-transform hover:scale-105 active:scale-95"
              >
                <PenLine className="size-4" />
              </button>
            </div>
          </div>

          <ActiveNow variant="full" />

          <div className="flex-1 overflow-y-auto">
            <ConversationList onSelect={(id) => router.push(`/messages/${id}`)} />
          </div>
        </div>

        <div className="hidden min-h-0 flex-1 flex-col items-center justify-center text-center lg:flex">
          <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-teal/20 to-brand-green/20">
            <MessageCircle className="size-10 text-brand-teal" />
          </div>
          <h2 className="mb-1 font-display text-xl font-bold text-[var(--text-primary)]">
            Your Messages
          </h2>
          <p className="max-w-xs text-sm text-[var(--text-secondary)]">
            Select a conversation from the left or start a new one
          </p>
        </div>
      </GlassCard>

      <NewConversationModal
        open={newConvoOpen}
        onClose={() => setNewConvoOpen(false)}
        currentUserId={userId}
      />
      <NewConversationModal
        open={newGroupOpen}
        onClose={() => setNewGroupOpen(false)}
        groupMode
        currentUserId={userId}
      />
    </>
  );
}
