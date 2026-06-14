"use client";

import { memo, useCallback } from "react";
import { useGetConversationsQuery } from "@/redux/api/messagingApi";
import { useAppSelector } from "@/hooks";
import { ConversationItem } from "./ConversationItem";
import type { Conversation } from "@/types/conversation";

const ConversationListItem = memo(function ConversationListItem({
  conv,
  currentUserId,
  activeId,
  onSelect,
}: {
  conv: Conversation;
  currentUserId: string;
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  const handleClick = useCallback(() => onSelect(conv.id), [onSelect, conv.id]);
  return (
    <ConversationItem
      conversation={conv}
      currentUserId={currentUserId}
      active={conv.id === activeId}
      onClick={handleClick}
    />
  );
});

export function ConversationList({
  activeId,
  onSelect,
}: {
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  const { data: conversationsData, isLoading, isError, refetch } = useGetConversationsQuery();
  const conversations = conversationsData?.data ?? [];
  const currentUserId = useAppSelector((s) => s.auth.user?.id);

  if (isLoading) {
    return (
      <div className="space-y-1 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl p-3">
            <div className="size-11 shrink-0 animate-pulse rounded-full bg-[var(--bg-subtle)]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-28 animate-pulse rounded-md bg-[var(--bg-subtle)]" />
              <div className="h-2.5 w-40 animate-pulse rounded-md bg-[var(--bg-subtle)]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="text-sm text-red-400">Failed to load</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-xs text-brand-teal underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!conversations?.length) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-[var(--bg-subtle)]">
          <span className="text-2xl">💬</span>
        </div>
        <p className="mb-1 text-sm font-semibold text-[var(--text-primary)]">No messages yet</p>
        <p className="max-w-[200px] text-xs text-[var(--text-secondary)]">
          Start a conversation with someone to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 p-2">
      {conversations.map((conv) => (
        <ConversationListItem
          key={conv.id}
          conv={conv}
          currentUserId={currentUserId || ""}
          activeId={activeId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
