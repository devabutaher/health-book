"use client";

import { memo, useSyncExternalStore } from "react";
import type { Conversation } from "@/types/conversation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatRelativeTime } from "@/lib/utils";
import { OnlineStatus } from "./OnlineStatus";
import { isOnline, subscribeOnline } from "@/lib/onlineStore";
import { Users } from "lucide-react";

function useIsOnline(userId: string | undefined): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => (userId ? isOnline(userId) : false),
    () => false,
  );
}

export const ConversationItem = memo(function ConversationItem({
  conversation,
  currentUserId,
  active,
  onClick,
}: {
  conversation: Conversation;
  currentUserId: string;
  active: boolean;
  onClick: () => void;
}) {
  const otherParticipant = !conversation.isGroup
    ? conversation.participants.find((p) => p.userId !== currentUserId)
    : null;

  const isOnline = useIsOnline(otherParticipant?.userId);

  const displayName = conversation.isGroup
    ? conversation.groupName || "Group"
    : otherParticipant?.user.name || conversation.participants[0]?.user.name || "Unknown";

  const avatar = conversation.isGroup
    ? conversation.groupAvatar
    : otherParticipant?.user.avatar || conversation.participants[0]?.user.avatar;

  const initials = displayName.slice(0, 2).toUpperCase();
  const lastMessage = conversation.lastMessage?.content || "No messages yet";
  const lastTime = conversation.lastMessage
    ? formatRelativeTime(conversation.lastMessage.createdAt)
    : "";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
        active
          ? "bg-gradient-to-r from-brand-teal/15 to-brand-green/15 border border-brand-teal/15"
          : "hover:bg-[var(--bg-overlay)]",
      )}
    >
      <div className="relative shrink-0">
        <Avatar size="default" className="size-11">
          {avatar ? <AvatarImage src={avatar} alt={displayName} /> : null}
          <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-white font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        {otherParticipant ? (
          <OnlineStatus online={isOnline} className="absolute -bottom-0.5 -right-0.5" />
        ) : (
          <div className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[var(--bg-elevated)]">
            <Users className="size-2.5 text-[var(--text-muted)]" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {displayName}
          </span>
          {lastTime && (
            <span className="shrink-0 text-[10px] text-[var(--text-muted)]">{lastTime}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-[var(--text-secondary)]">{lastMessage}</span>
          {conversation.unreadCount > 0 && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-brand-teal to-brand-green text-[9px] font-bold text-white">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});
