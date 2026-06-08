"use client";

import { memo } from "react";
import type { GroupMember, GroupRole } from "@/types/group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Shield, UserMinus, Star, User } from "lucide-react";
import { useAppSelector } from "@/hooks";

const roleStyles: Record<string, string> = {
  ADMIN: "bg-brand-amber/10 text-brand-amber border-brand-amber/20",
  MODERATOR: "bg-brand-blue/10 text-brand-blue border-brand-blue/20",
  MEMBER: "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
};

type RoleOption = { value: GroupRole; label: string; icon: typeof Star };

const roleOptions: RoleOption[] = [
  { value: "ADMIN", label: "Admin", icon: Star },
  { value: "MODERATOR", label: "Moderator", icon: Shield },
  { value: "MEMBER", label: "Member", icon: User },
];

export const GroupMemberItem = memo(function GroupMemberItem({
  member,
  currentUserRole,
  onRoleChange,
  onRemove,
}: {
  member: GroupMember;
  currentUserRole: GroupRole | null;
  onRoleChange?: (userId: string, role: GroupRole) => void;
  onRemove?: (userId: string) => void;
}) {
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const showActions = currentUserRole === "ADMIN" && member.userId !== currentUserId;
  const RoleIcon = roleOptions.find((r) => r.value === member.role)?.icon || User;

  return (
    <div className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--bg-overlay)]">
      <a href={`/${member.user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar size="default" className="size-10">
          {member.user.avatar ? (
            <AvatarImage src={member.user.avatar} alt={member.user.name} />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-sm text-white">
            {member.user.name?.charAt(0)?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {member.user.name}
          </p>
          <p className="truncate text-xs text-[var(--text-muted)]">@{member.user.username}</p>
        </div>
      </a>

      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold",
          roleStyles[member.role],
        )}
      >
        <RoleIcon className="size-3" />
        {member.role}
      </span>

      {showActions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex size-8 items-center justify-center rounded-xl text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-[var(--bg-overlay)] group-hover:opacity-100">
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Manage Member</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {roleOptions.map((opt) => {
              if (opt.value === member.role) return null;
              const Icon = opt.icon;
              return (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => onRoleChange?.(member.userId, opt.value)}
                >
                  <Icon className="size-4" />
                  Set as {opt.label}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onRemove?.(member.userId)}>
              <UserMinus className="size-4" />
              Remove from group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
});
