"use client";

import { Users, Calendar, Trash2 } from "lucide-react";
import type { Group } from "@/types/group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GroupTypeBadge } from "./GroupTypeBadge";

export function GroupHeader({
  group,
  isMember,
  onJoin,
  onLeave,
  onEdit,
  onDelete,
}: {
  group: Group;
  isMember: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const initials = group.name.slice(0, 2).toUpperCase();

  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)]">
      <div className="relative px-4 sm:px-6 pb-4 sm:pb-5">
        <Avatar className="absolute -top-12 size-20 shrink-0 ring-4 ring-[var(--bg-elevated)]">
          {group.avatar ? <AvatarImage src={group.avatar} alt={group.name} /> : null}
          <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-xl text-white">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-4 pt-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-xl font-bold text-[var(--text-primary)]">
                {group.name}
              </h1>
              <GroupTypeBadge type={group.type} />
            </div>
            {group.description && (
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{group.description}</p>
            )}
            <div className="mt-2 flex items-center gap-4 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <Users className="size-3.5" />
                {group.memberCount} members
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                Created {new Date(group.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {isMember ? (
              <>
                {onEdit && (
                  <Button variant="secondary" size="sm" onClick={onEdit}>
                    Settings
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDelete}
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLeave}
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-400"
                >
                  Leave
                </Button>
              </>
            ) : (
              <Button variant="gradient" size="sm" onClick={onJoin}>
                Join Group
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
