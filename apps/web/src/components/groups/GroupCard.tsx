"use client";

import Image from "next/image";
import Link from "next/link";
import { Users, Check, Loader2 } from "lucide-react";
import { memo } from "react";
import { motion } from "framer-motion";
import type { Group } from "@/types/group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GroupTypeBadge } from "./GroupTypeBadge";
import { useJoinGroupMutation, useLeaveGroupMutation } from "@/redux/api/groupsApi";
import { toast } from "sonner";

export const GroupCard = memo(function GroupCard({ group }: { group: Group }) {
  const initials = group.name.slice(0, 2).toUpperCase();
  const [joinGroup, { isLoading: isJoining }] = useJoinGroupMutation();
  const [leaveGroup, { isLoading: isLeaving }] = useLeaveGroupMutation();

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await joinGroup(group.id).unwrap();
      toast.success("Joined group!");
    } catch {
      toast.error("Failed to join group");
    }
  };

  const handleLeave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await leaveGroup(group.id).unwrap();
      toast.success("Left group");
    } catch {
      toast.error("Failed to leave group");
    }
  };

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Link
        href={`/groups/${group.id}`}
        prefetch={false}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-lg)]"
      >
        <div className="aspect-video overflow-hidden bg-[var(--bg-subtle)]">
          {group.coverPhoto ? (
            <Image
              src={group.coverPhoto}
              alt=""
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              width={400}
              height={225}
            />
          ) : (
            <div className="size-full bg-gradient-to-br from-brand-teal/20 via-brand-blue/20 to-brand-green/20" />
          )}
        </div>

        <div className="relative flex flex-1 flex-col px-4 pb-4 pt-0">
          <div className="flex items-end justify-between">
            <Avatar className="relative -mt-7 size-14 shrink-0 ring-4 ring-[var(--bg-elevated)]">
              {group.avatar ? <AvatarImage src={group.avatar} alt={group.name} /> : null}
              <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-lg font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>

            {group.isMember ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLeave}
                disabled={isLeaving}
                className="h-8 rounded-lg border-brand-teal/30 text-[11px] font-semibold text-brand-teal hover:bg-brand-teal/10 hover:text-brand-teal"
              >
                {isLeaving ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Check className="size-3" />
                )}
                <span className="ml-1">Joined</span>
              </Button>
            ) : (
              <Button
                variant="gradient"
                size="sm"
                onClick={handleJoin}
                disabled={isJoining}
                className="h-8 rounded-lg px-3 text-[11px] font-semibold"
              >
                {isJoining ? <Loader2 className="size-3 animate-spin" /> : null}
                {isJoining ? "Joining..." : "Join"}
              </Button>
            )}
          </div>

          <h3 className="mt-2 truncate text-sm font-bold text-[var(--text-primary)]">
            {group.name}
          </h3>

          <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-secondary)]">
            {group.description || "No description"}
          </p>

          <div className="mt-3 flex items-center gap-3">
            <GroupTypeBadge type={group.type} />
            <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
              <Users className="size-3" />
              {group.memberCount}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});
