"use client";

import { memo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetUnreadCountQuery,
  useGetNotificationsQuery,
  useMarkAllReadMutation,
} from "@/redux/api/notificationApi";
import { useAppSelector } from "@/hooks";
import NotificationItem from "./NotificationItem";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const NotificationBell = memo(function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isAuthLoading = useAppSelector((s) => s.auth.isLoading);
  const { data: countData } = useGetUnreadCountQuery(undefined, {
    skip: isAuthLoading,
  });
  const { data: notifData, isFetching } = useGetNotificationsQuery({ limit: 5 }, { skip: !open });
  const [markAllRead] = useMarkAllReadMutation();

  const unread = countData?.data?.count || 0;
  const notifications =
    (notifData as { notifications?: unknown[] } | undefined)?.notifications || [];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  return (
    <div ref={dropdownRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        className={cn(
          "relative size-9 rounded-xl text-muted-foreground",
          "hover:bg-[var(--bg-overlay)] hover:text-foreground",
          "active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40",
        )}
      >
        <Bell className="size-5" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className={cn(
                "absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full",
                "px-1 text-[10px] font-bold text-white",
                "bg-gradient-to-br from-brand-coral to-brand-pink",
                "shadow-[0_0_8px_rgba(244,63,94,0.6)]",
                "ring-2 ring-[var(--background)]",
              )}
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "fixed left-3 right-3 top-[60px] z-50 sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80",
              "rounded-2xl border border-[var(--glass-border)]",
              "bg-[var(--popover)] backdrop-blur-2xl",
              "shadow-[var(--shadow-lg)]",
              "overflow-hidden",
            )}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Notifications</h3>
                {unread > 0 && (
                  <span className="rounded-full bg-brand-teal/15 px-2 py-0.5 text-[10px] font-semibold text-brand-teal">
                    {unread} new
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={() => markAllRead(undefined)}
                  className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-brand-teal"
                >
                  <CheckCheck className="size-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isFetching && notifications.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Spinner />
                  <span>Loading…</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-[var(--bg-overlay)]">
                    <Bell className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                  <p className="text-xs text-muted-foreground/70">You&apos;re all caught up</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {(notifications as Parameters<typeof NotificationItem>[0]["notif"][]).map((n) => (
                    <NotificationItem key={n.id} notif={n} />
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className={cn(
                "group flex items-center justify-center gap-1.5",
                "border-t border-[var(--border-subtle)] px-4 py-2.5",
                "text-sm font-medium text-primary",
                "transition-colors hover:bg-brand-teal/5",
              )}
            >
              View all notifications
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default NotificationBell;
