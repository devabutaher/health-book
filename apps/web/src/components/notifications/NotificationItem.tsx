"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  UserPlus,
  Heart,
  MessageCircle,
  Reply,
  Bell,
  Trophy,
  Trash2,
  AtSign,
  Flame,
  MessageSquare,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Notification } from "@/redux/api/notificationApi";
import { useDeleteNotificationMutation, useMarkReadMutation } from "@/redux/api/notificationApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const typeConfig: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  NEW_FOLLOWER: {
    icon: UserPlus,
    label: "started following you",
    color: "from-brand-blue to-brand-teal",
  },
  POST_REACTION: {
    icon: Heart,
    label: "reacted to your post",
    color: "from-brand-coral to-brand-pink",
  },
  POST_COMMENT: {
    icon: MessageCircle,
    label: "commented on your post",
    color: "from-brand-teal to-brand-green",
  },
  COMMENT_REPLY: {
    icon: Reply,
    label: "replied to your comment",
    color: "from-brand-purple to-brand-pink",
  },
  CHALLENGE_INVITE: {
    icon: Trophy,
    label: "invited you to a challenge",
    color: "from-brand-amber to-brand-coral",
  },
  MENTION: {
    icon: AtSign,
    label: "mentioned you",
    color: "from-brand-purple to-brand-indigo",
  },
  MESSAGE: {
    icon: MessageSquare,
    label: "sent you a message",
    color: "from-brand-teal to-brand-blue",
  },
  STREAK_MILESTONE: {
    icon: Flame,
    label: "hit a streak milestone!",
    color: "from-brand-amber to-brand-coral",
  },
  STREAK_AT_RISK: {
    icon: AlertTriangle,
    label: "your streak is at risk!",
    color: "from-brand-coral to-brand-pink",
  },
  SYSTEM: {
    icon: Bell,
    label: "system notification",
    color: "from-brand-indigo to-brand-blue",
  },
};

const fallbackConfig = {
  icon: Bell,
  label: "interacted with you",
  color: "from-brand-indigo to-brand-purple",
};

export default function NotificationItem({ notif }: { notif: Notification }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();
  const [markRead] = useMarkReadMutation();
  const config = typeConfig[notif.type] ?? fallbackConfig;
  const Icon = config.icon;
  const href = notif.postId
    ? `/post/${notif.postId}`
    : notif.type === "CHALLENGE_INVITE"
      ? "/challenges"
      : notif.type === "MESSAGE"
        ? "/messages"
        : `/${notif.fromUser?.username || ""}`;
  const time = useMemo(() => new Date(notif.createdAt), [notif.createdAt]);
  const relative = useMemo(() => formatRelativeTime(time), [time]);

  const handleDelete = async () => {
    try {
      await deleteNotification(notif.id).unwrap();
    } catch {
      /* silent */
    }
    setDeleteOpen(false);
  };

  const handleClick = () => {
    if (!notif.read) markRead(notif.id);
  };

  return (
    <div className="group relative">
      <Link
        href={href}
        onClick={handleClick}
        onAuxClick={handleClick}
        className={cn(
          "relative flex items-start gap-3 px-4 py-3",
          "transition-colors duration-150",
          "hover:bg-[var(--bg-overlay)] focus-visible:bg-[var(--bg-overlay)] focus-visible:outline-none",
          !notif.read && "bg-brand-teal/[0.04]",
        )}
      >
        <div className="relative shrink-0">
          {notif.fromUser?.avatar ? (
            <Image
              src={notif.fromUser.avatar}
              alt={notif.fromUser.name ?? ""}
              width={36}
              height={36}
              className="size-9 rounded-full object-cover ring-1 ring-[var(--border-default)]"
            />
          ) : (
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-full",
                "bg-gradient-to-br text-sm font-semibold text-white",
                config.color,
              )}
            >
              {notif.fromUser?.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full",
              "bg-gradient-to-br text-white ring-2 ring-[var(--popover)]",
              config.color,
            )}
          >
            <Icon className="size-2.5" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            <span className="font-semibold text-foreground">
              {notif.fromUser?.name || "Someone"}
            </span>{" "}
            <span className="text-muted-foreground">{config.label}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{relative}</p>
        </div>

        {!notif.read && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mt-2 size-2 shrink-0 rounded-full bg-gradient-to-br from-brand-teal to-brand-green shadow-[0_0_6px_rgba(20,184,166,0.6)]"
          />
        )}
      </Link>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setDeleteOpen(true);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-xl text-[var(--text-muted)] opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
        aria-label="Delete notification"
      >
        <Trash2 className="size-4" />
      </button>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete notification?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
