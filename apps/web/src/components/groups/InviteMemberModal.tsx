"use client";

import { useState, useDeferredValue } from "react";
import { X, Search, Check, Loader2 } from "lucide-react";
import { useInviteUserMutation } from "@/redux/api/groupsApi";
import { useSearchUsersQuery } from "@/redux/api/searchApi";
import { motion, AnimatePresence } from "framer-motion";
import { scaleIn } from "@/lib/motion/variants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function InviteMemberModal({
  open,
  onClose,
  groupId,
}: {
  open: boolean;
  onClose: () => void;
  groupId: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const deferred = useDeferredValue(query);
  const { data: users } = useSearchUsersQuery(deferred, { skip: deferred.length < 1 });
  const [inviteUser] = useInviteUserMutation();

  const toggleUser = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));
  };

  const handleSend = async () => {
    if (!selected.length) return;
    setInviting(true);
    const results = await Promise.allSettled(
      selected.map((userId) => inviteUser({ groupId, userId }).unwrap()),
    );
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    if (succeeded > 0)
      toast.success(
        `Invite${succeeded > 1 ? "s" : ""} sent to ${succeeded} user${succeeded > 1 ? "s" : ""}`,
      );
    if (failed > 0) toast.error(`Failed to invite ${failed} user${failed > 1 ? "s" : ""}`);
    setInviting(false);
    setQuery("");
    setSelected([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:items-center sm:pt-0">
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
            className="relative w-full max-w-xl rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)]"
            data-custom-modal
          >
            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
              <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                Invite Members
              </h2>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="border-b border-[var(--border-default)] px-4 py-2">
              <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-subtle)] px-3 py-2">
                <Search className="size-4 text-[var(--text-muted)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search users..."
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                />
              </div>
            </div>

            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-b border-[var(--border-default)] px-4 py-2">
                {selected.map((id) => {
                  const u = users?.find((x) => x.id === id);
                  return u ? (
                    <span
                      key={id}
                      className="flex items-center gap-1 rounded-full bg-brand-teal/10 px-2.5 py-1 text-xs text-brand-teal"
                    >
                      @{u.username}
                      <button
                        onClick={() => toggleUser(id)}
                        className="ml-0.5 hover:text-brand-teal/70"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}

            <div className="max-h-72 overflow-y-auto p-2">
              {!users?.length && query.length >= 1 && (
                <p className="py-8 text-center text-sm text-[var(--text-muted)]">No users found</p>
              )}
              {(users || []).map(
                (user: { id: string; name: string; username: string; avatar: string | null }) => {
                  const isSelected = selected.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--bg-overlay)]"
                    >
                      <Avatar size="sm" className="size-9">
                        {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                        <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-xs text-white">
                          {user.name?.charAt(0)?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-[var(--text-muted)]">
                          @{user.username}
                        </p>
                      </div>
                      <div
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          isSelected
                            ? "border-brand-teal bg-brand-teal text-white"
                            : "border-[var(--border-default)]"
                        }`}
                      >
                        {isSelected && <Check className="size-3.5" />}
                      </div>
                    </button>
                  );
                },
              )}
            </div>

            {selected.length > 0 && (
              <div className="border-t border-[var(--border-default)] px-4 py-3">
                <Button
                  variant="gradient"
                  onClick={handleSend}
                  disabled={inviting}
                  className="w-full"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    `Send Invite${selected.length > 1 ? "s" : ""} (${selected.length})`
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
