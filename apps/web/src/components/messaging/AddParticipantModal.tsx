"use client";

import { useState, useDeferredValue } from "react";
import { X, Search, Check, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAddParticipantMutation } from "@/redux/api/messagingApi";
import { useSearchUsersQuery } from "@/redux/api/searchApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AddParticipantModal({
  open,
  onClose,
  conversationId,
  existingMemberIds,
}: {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  existingMemberIds?: string[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const deferred = useDeferredValue(query);
  const { data: users } = useSearchUsersQuery(deferred, { skip: deferred.length < 1 });
  const [addParticipant, { isLoading }] = useAddParticipantMutation();

  const memberSet = new Set(existingMemberIds || []);

  const toggleUser = (id: string) => {
    if (memberSet.has(id)) return;
    setSelected((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));
  };

  const handleAdd = async () => {
    if (!selected.length) return;
    try {
      for (const userId of selected) {
        await addParticipant({ conversationId, userId }).unwrap();
      }
      toast.success(selected.length > 1 ? "Participants added" : "Participant added");
      setQuery("");
      setSelected([]);
      onClose();
    } catch {
      toast.error("Failed to add participant");
    }
  };

  const newCount = selected.length;

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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
              <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                Add People
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

            <div className="max-h-72 overflow-y-auto p-2">
              {!users?.length && query.length >= 1 && (
                <p className="py-8 text-center text-sm text-[var(--text-muted)]">No users found</p>
              )}
              {(users || []).map(
                (user: { id: string; name: string; username: string; avatar: string | null }) => {
                  const isMember = memberSet.has(user.id);
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
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          isMember && "border-brand-teal/40 bg-brand-teal/10 text-brand-teal/60",
                          isSelected && !isMember && "border-brand-teal bg-brand-teal text-white",
                          !isMember && !isSelected && "border-[var(--border-default)]",
                        )}
                      >
                        {isMember ? (
                          <UserCheck className="size-3.5" />
                        ) : isSelected ? (
                          <Check className="size-3.5" />
                        ) : null}
                      </div>
                    </button>
                  );
                },
              )}
            </div>

            {newCount > 0 && (
              <div className="border-t border-[var(--border-default)] px-4 py-3">
                <button
                  onClick={handleAdd}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-teal to-brand-green px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? "Adding..." : `Add ${newCount > 1 ? `(${newCount})` : ""}`}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
