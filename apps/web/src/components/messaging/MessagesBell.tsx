"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetUnreadCountQuery } from "@/redux/api/messagingApi";
import { useAppSelector } from "@/hooks";
import { cn } from "@/lib/utils";

export default function MessagesBell() {
  const pathname = usePathname();
  const isAuthLoading = useAppSelector((s) => s.auth.isLoading);
  const { data } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000,
    skip: isAuthLoading,
  });

  const unread = data?.count || 0;

  return (
    <Link
      href="/messages"
      aria-label="Messages"
      className={cn(
        "relative flex size-9 items-center justify-center rounded-xl",
        "text-muted-foreground transition-colors",
        "hover:bg-[var(--bg-overlay)] hover:text-foreground",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40",
        pathname.startsWith("/messages") && "bg-[var(--bg-overlay)] text-foreground",
      )}
    >
      <MessageCircle className="size-5" />
      <AnimatePresence>
        {unread > 0 && (
          <motion.span
            key="msg-badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={cn(
              "absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full",
              "px-1 text-[10px] font-bold text-white",
              "bg-gradient-to-br from-brand-blue to-brand-teal",
              "shadow-[0_0_8px_rgba(59,130,246,0.6)]",
              "ring-2 ring-[var(--background)]",
            )}
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
