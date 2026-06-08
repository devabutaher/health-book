"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { AlertCircle, BellOff, Check } from "lucide-react";
import { Virtuoso } from "react-virtuoso";
import {
  useGetNotificationsQuery,
  useMarkAllReadMutation,
  type Notification,
} from "@/redux/api/notificationApi";
import NotificationItem from "@/components/notifications/NotificationItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useFeedPagination } from "@/hooks/useFeedPagination";

export default function NotificationsPage() {
  const [cursor] = useState<string | undefined>(undefined);
  const { allPosts: allNotifications, loadMore, applyPage } = useFeedPagination<Notification>();
  const [markAllRead] = useMarkAllReadMutation();

  const { data, isLoading, isFetching, isError, refetch } = useGetNotificationsQuery({ cursor });

  useEffect(() => {
    const notifications =
      (data as { notifications?: Notification[] } | undefined)?.notifications ?? [];
    if (!notifications.length) return;
    const nextCursor = (data as { nextCursor?: string } | undefined)?.nextCursor;
    applyPage({ posts: notifications as unknown[], nextCursor }, Boolean(cursor));
  }, [data, cursor, applyPage]);

  const isFetchingRef = useRef(isFetching);
  isFetchingRef.current = isFetching;
  const hasMore = (data as { hasMore?: boolean } | undefined)?.hasMore ?? false;
  const nextCursor = (data as { nextCursor?: string } | undefined)?.nextCursor;

  return (
    <div className="mx-auto max-w-[600px]">
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay updated with your community</p>
        </div>
        {allNotifications.some((n) => !n.read) && (
          <Button variant="outline" size="sm" onClick={() => markAllRead(undefined)}>
            <Check />
            Mark all read
          </Button>
        )}
      </div>

      {isError ? (
        <Empty>
          <EmptyMedia variant="gradient">
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>Couldn&apos;t load notifications</EmptyTitle>
          <EmptyDescription>Check your connection and try again.</EmptyDescription>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </Empty>
      ) : allNotifications.length === 0 && !isLoading ? (
        <Empty>
          <EmptyMedia variant="gradient">
            <BellOff />
          </EmptyMedia>
          <EmptyTitle>No notifications yet</EmptyTitle>
          <EmptyDescription>Follow people to see their activity here.</EmptyDescription>
        </Empty>
      ) : (
        <GlassCard variant="subtle" className="overflow-hidden p-0">
          <Virtuoso
            useWindowScroll
            data={allNotifications}
            endReached={() => {
              if (hasMore && nextCursor && !isFetchingRef.current) {
                loadMore(nextCursor);
              }
            }}
            increaseViewportBy={400}
            overscan={200}
            itemContent={(_index, n) => (
              <div className="divide-y divide-[var(--border-subtle)]">
                <NotificationItem notif={n} />
              </div>
            )}
          />
        </GlassCard>
      )}

      {isLoading && (
        <div className="mt-4 flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}
      {isFetching && allNotifications.length > 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">Loading more...</p>
      )}
    </div>
  );
}
