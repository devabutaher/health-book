"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import {
  useGetConversationQuery,
  useSendMessageMutation,
  useMarkReadMutation,
  messagingApi,
} from "@/redux/api/messagingApi";
import { useAppDispatch } from "@/hooks";
import { useSound } from "@/hooks/useSound";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export function ChatWindow({
  conversationId,
  isGroup,
}: {
  conversationId: string;
  isGroup?: boolean;
}) {
  const { data, isLoading, error, isError } = useGetConversationQuery({ id: conversationId });
  const [sendMessage] = useSendMessageMutation();
  const [markRead] = useMarkReadMutation();
  const loadingOlderRef = useRef(false);
  const { play } = useSound();
  const dispatch = useAppDispatch();
  const [loadingMore, setLoadingMore] = useState(false);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const allMessages = useMemo(() => {
    const msgs = data?.messages || [];
    return [...msgs].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [data?.messages]);

  useEffect(() => {
    if (conversationId) {
      markRead(conversationId);
    }
  }, [conversationId, markRead]);

  const handleSend = useCallback(
    async (content: string, mediaUrl?: string) => {
      play("message-send");
      try {
        await sendMessage({ conversationId, content: content || undefined, mediaUrl }).unwrap();
      } catch {
        toast.error("Failed to send message");
      }
    },
    [play, sendMessage, conversationId],
  );

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleLoadMore = useCallback(async () => {
    if (!data?.nextCursor || loadingMore) return;
    loadingOlderRef.current = true;
    setLoadingMore(true);

    try {
      const result = await dispatch(
        messagingApi.endpoints.getConversation.initiate(
          { id: conversationId, cursor: data.nextCursor },
          { forceRefetch: true },
        ),
      ).unwrap();

      dispatch(
        messagingApi.util.updateQueryData("getConversation", { id: conversationId }, (draft) => {
          const existingIds = new Set(draft.messages.map((m) => m.id));
          const newMessages = result.messages.filter((m) => !existingIds.has(m.id));
          draft.messages.unshift(...newMessages);
          draft.nextCursor = result.nextCursor;
          draft.hasMore = result.hasMore;
        }),
      );
    } catch {
      // handled below
    } finally {
      loadingOlderRef.current = false;
      setLoadingMore(false);
    }
  }, [data?.nextCursor, loadingMore, dispatch, conversationId]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`flex gap-2 ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}>
            <div className="h-8 w-24 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-[var(--text-secondary)]">Failed to load messages</p>
        <p className="text-xs text-[var(--text-muted)]">
          {error instanceof Error ? error.message : "Something went wrong"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-[var(--bg-overlay)] px-4 py-2 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)]"
        >
          Try again
        </button>
      </div>
    );
  }

  const MESSAGE_ESTIMATED_HEIGHT = 72;

  return (
    <ErrorBoundary>
      <div className="flex min-h-0 flex-1 flex-col">
        <Virtuoso
          ref={virtuosoRef}
          className="flex-1 overflow-y-auto"
          data={allMessages}
          initialTopMostItemIndex={allMessages.length > 0 ? allMessages.length - 1 : 0}
          followOutput="smooth"
          alignToBottom
          increaseViewportBy={200}
          itemContent={(_index, msg) => (
            <div className="px-3 py-0.5">
              <ChatBubble key={msg.id} message={msg} isGroup={isGroup} />
            </div>
          )}
          components={{
            Header: () => (
              <>
                {data?.hasMore ? (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="flex items-center gap-1.5 rounded-full bg-[var(--bg-subtle)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-overlay)] hover:text-[var(--text-secondary)] disabled:opacity-50"
                    >
                      <ChevronUp className="size-3" />
                      {loadingMore ? "Loading..." : "Load older messages"}
                    </button>
                  </div>
                ) : null}
              </>
            ),
            EmptyPlaceholder: () => (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm text-[var(--text-secondary)]">No messages yet</p>
                <p className="text-xs text-[var(--text-muted)]">Say hello!</p>
              </div>
            ),
          }}
          defaultItemHeight={MESSAGE_ESTIMATED_HEIGHT}
        />
        <ChatInput onSend={handleSend} />
      </div>
    </ErrorBoundary>
  );
}
