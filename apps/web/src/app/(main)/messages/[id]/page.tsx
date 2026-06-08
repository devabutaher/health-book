"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, PenLine, AlertCircle, RefreshCw } from "lucide-react";
import { ActiveNow } from "@/components/shared/ActiveNow";
import { ConversationHeader } from "@/components/messaging/ConversationHeader";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { ConversationList } from "@/components/messaging/ConversationList";
import { NewConversationModal } from "@/components/messaging/NewConversationModal";
import { useGetConversationsQuery } from "@/redux/api/messagingApi";
import { useMessageRealtime } from "@/hooks/useMessageRealtime";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useConversationRealtime } from "@/hooks/useConversationRealtime";
import { useAppSelector } from "@/hooks";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const userId = useAppSelector((s) => s.auth.user?.id);
  const {
    data: allConvos,
    isError: convsError,
    refetch: refetchConvs,
  } = useGetConversationsQuery();
  const conv = allConvos?.data?.find((c) => c.id === id);
  const isGroup = conv?.isGroup;
  const [newConvoOpen, setNewConvoOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useMessageRealtime(id, userId);
  useUnreadCount();
  useConversationRealtime();

  if (convsError) {
    return (
      <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-5xl items-center justify-center">
        <GlassCard className="p-10 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--bg-subtle)]">
            <AlertCircle className="size-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Couldn&apos;t load conversations.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetchConvs()}>
            <RefreshCw /> Try again
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <>
      <GlassCard
        variant="elevated"
        className="mx-auto flex h-[calc(100vh-10rem)] max-w-5xl overflow-hidden! rounded-2xl md:h-[calc(100vh-8rem)]"
      >
        <div className="hidden w-96 flex-col border-r border-[var(--border-default)] lg:flex">
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
            <ConversationList
              activeId={id}
              onSelect={(convId) => router.push(`/messages/${convId}`)}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <ConversationHeader
            conversationId={id}
            currentUserId={userId}
            onBack={() => router.push("/messages")}
            onToggleSidebar={() => setSidebarOpen(true)}
          />
          <ChatWindow conversationId={id} isGroup={isGroup} />
        </div>
      </GlassCard>

      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: -320 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -320 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative flex w-80 flex-col bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
                <h1 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  Messages
                </h1>
                <div className="flex items-center gap-1">
                  <button
                    aria-label="New group"
                    onClick={() => {
                      setSidebarOpen(false);
                      setNewGroupOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-amber to-brand-coral px-3 py-2 text-xs font-semibold text-white shadow-[var(--shadow-glow-amber)] transition-transform hover:scale-105 active:scale-95"
                  >
                    <Users className="size-3.5" />
                    New Group
                  </button>
                  <button
                    aria-label="New message"
                    onClick={() => {
                      setSidebarOpen(false);
                      setNewConvoOpen(true);
                    }}
                    className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-r from-brand-teal to-brand-green text-white shadow-[var(--shadow-glow-teal)] transition-transform hover:scale-105 active:scale-95"
                  >
                    <PenLine className="size-4" />
                  </button>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="flex size-9 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
              <ActiveNow variant="full" />
              <div className="flex-1 overflow-y-auto">
                <ConversationList
                  activeId={id}
                  onSelect={(convId) => {
                    router.push(`/messages/${convId}`);
                    setSidebarOpen(false);
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
