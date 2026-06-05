"use client";

import { useState } from "react";
import { X, Search, UserPlus } from "lucide-react";
import { useInviteToChallengeMutation } from "@/redux/api/challengesApi";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { scaleIn } from "@/lib/motion/variants";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchUsersQuery } from "@/redux/api/searchApi";
import { useSound } from "@/hooks/useSound";

export function ChallengeInviteModal({
  challengeId,
  open,
  onClose,
}: {
  challengeId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 300);
  const { data: results } = useSearchUsersQuery(debounced, { skip: debounced.length < 2 });
  const [invite, { isLoading }] = useInviteToChallengeMutation();
  const { play } = useSound();

  const users = results || [];

  const handleInvite = async (userId: string) => {
    try {
      await invite({ challengeId, userId }).unwrap();
      play("success");
      toast.success("Invitation sent!");
    } catch {
      play("error");
      toast.error("Failed to invite");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-xl rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-lg)]"
            data-custom-modal
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                <UserPlus className="mr-1.5 inline size-4 text-brand-teal" />
                Invite Friends
              </h2>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
              />
            </div>

            <div className="max-h-72 space-y-1 overflow-y-auto">
              {users.length === 0 ? (
                <p className="py-8 text-center text-xs text-[var(--text-muted)]">
                  {debounced.length < 2 ? "Type at least 2 characters to search" : "No users found"}
                </p>
              ) : (
                users.map(
                  (u: { id: string; name: string; username: string; avatar: string | null }) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--bg-overlay)]"
                    >
                      <Avatar size="sm" className="size-8 shrink-0">
                        {u.avatar ? <AvatarImage src={u.avatar} /> : null}
                        <AvatarFallback className="text-xs">{u.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {u.name}
                        </p>
                        <p className="truncate text-[10px] text-[var(--text-muted)]">
                          @{u.username}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleInvite(u.id)}
                        disabled={isLoading}
                      >
                        Invite
                      </Button>
                    </div>
                  ),
                )
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
