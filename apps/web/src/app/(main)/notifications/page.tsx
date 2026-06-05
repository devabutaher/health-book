"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { BellOff, Check } from "lucide-react";
import { motion } from "framer-motion";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
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
import { staggerContainer, staggerItem } from "@/lib/motion/variants";

export default function NotificationsPage() {

  const [cursor] = useState<string | undefined>(undefined);
  const { allPosts: allNotifications, loadMore, applyPage } = useFeedPagination<Notification>();
  const loaderRef = useRef<HTMLDivElement>(null);
  const [markAllRead] = useMarkAllReadMutation();

  const { data, isLoading, isFetching } = useGetNotificationsQuery({ cursor });

  useEffect(() => {
    const notifications =
      (data as { notifications?: Notification[] } | undefined)?.notifications ?? [];
    if (!notifications.length) return;
    const nextCursor = (data as { nextCursor?: string } | undefined)?.nextCursor;
    applyPage({ posts: notifications as unknown[], nextCursor }, Boolean(cursor));
  }, [data, cursor, applyPage]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      const hasMore = (data as { hasMore?: boolean } | undefined)?.hasMore;
      const nextCursor = (data as { nextCursor?: string } | undefined)?.nextCursor;
      if (target.isIntersecting && hasMore && !isFetching && nextCursor) {
        loadMore(nextCursor);
      }
    },
    [data, isFetching, loadMore],
  );

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <ProtectedRoute>
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

        {allNotifications.length === 0 && !isLoading ? (
          <Empty>
            <EmptyMedia variant="gradient">
              <BellOff />
            </EmptyMedia>
            <EmptyTitle>No notifications yet</EmptyTitle>
            <EmptyDescription>Follow people to see their activity here.</EmptyDescription>
          </Empty>
        ) : (
          <GlassCard variant="subtle" className="overflow-hidden p-0">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="divide-y divide-[var(--border-subtle)]"
            >
              {allNotifications.map((n) => (
                <motion.div key={n.id} variants={staggerItem}>
                  <NotificationItem notif={n} />
                </motion.div>
              ))}
            </motion.div>
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

        <div ref={loaderRef} className="h-4" />
      </div>
    </ProtectedRoute>
  );
}
