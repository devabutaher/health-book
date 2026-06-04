"use client";

import { motion } from "framer-motion";
import type { GroupMember, GroupRole } from "@/types/group";
import { GroupMemberItem } from "./GroupMemberItem";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ChevronDown, Users } from "lucide-react";

const memberContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};

const memberItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export function GroupMembersList({
  members,
  totalCount,
  currentUserRole,
  hasMore,
  onLoadMore,
  onRoleChange,
  onRemove,
  loading,
}: {
  members: GroupMember[];
  totalCount: number;
  currentUserRole?: GroupRole | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onRoleChange?: (userId: string, role: GroupRole) => void;
  onRemove?: (userId: string) => void;
  loading?: boolean;
}) {
  return (
    <GlassCard variant="elevated" className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Users className="size-4 text-[var(--text-muted)]" />
        <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
          Members ({totalCount})
        </h2>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl p-2">
              <div className="size-10 animate-pulse rounded-full bg-[var(--bg-subtle)]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 animate-pulse rounded bg-[var(--bg-subtle)]" />
                <div className="h-2.5 w-16 animate-pulse rounded bg-[var(--bg-subtle)]" />
              </div>
            </div>
          ))}
        </div>
      ) : !members.length ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Users className="mb-3 size-8 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">No members yet</p>
        </div>
      ) : (
        <>
          <motion.div
            className="space-y-2"
            variants={memberContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {members.map((m) => (
              <motion.div key={m.userId} variants={memberItemVariants}>
                <GroupMemberItem
                  member={m}
                  currentUserRole={currentUserRole ?? null}
                  onRoleChange={onRoleChange}
                  onRemove={onRemove}
                />
              </motion.div>
            ))}
          </motion.div>

          {hasMore && (
            <div className="mt-4 text-center">
              <Button variant="ghost" size="sm" onClick={onLoadMore} disabled={loading}>
                {loading ? (
                  "Loading..."
                ) : (
                  <>
                    <ChevronDown className="size-4" />
                    Show more
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
}
