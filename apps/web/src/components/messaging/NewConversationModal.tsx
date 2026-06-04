"use client";

import { useState, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import { X, Search, Check, Users } from "lucide-react";
import { useCreateConversationMutation } from "@/redux/api/messagingApi";
import { useSearchUsersQuery } from "@/redux/api/searchApi";
import { motion, AnimatePresence } from "framer-motion";
import { scaleIn } from "@/lib/motion/variants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function NewConversationModal({
  open,
  onClose,
  groupMode,
  currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  groupMode?: boolean;
  currentUserId?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const deferred = useDeferredValue(query);
  const { data: users } = useSearchUsersQuery(deferred, { skip: deferred.length < 1 });
  const [createConversation, { isLoading }] = useCreateConversationMutation();

  const isGroup = groupMode || selected.length >= 2;

  const toggleUser = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));
  };

  const handleStart = async () => {
    if (!selected.length) return;
    try {
      const result = await createConversation({
        participantIds: selected,
        isGroup: isGroup || undefined,
        groupName: isGroup ? groupName.trim() || undefined : undefined,
      }).unwrap();
      toast.success(isGroup ? "Group created!" : "Conversation started!");
      onClose();
      setQuery("");
      setSelected([]);
      setGroupName("");
      router.push(`/messages/${result.id}`);
    } catch {
      toast.error("Failed to create conversation");
    }
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
                {groupMode ? "New Group" : "New Message"}
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

            {isGroup && (
              <div className="border-b border-[var(--border-default)] px-4 py-2">
                <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-subtle)] px-3 py-2">
                  <Users className="size-4 text-[var(--text-muted)]" />
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Group name (optional)"
                    className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="max-h-72 overflow-y-auto p-2">
              {!users?.length && query.length >= 1 && (
                <p className="py-8 text-center text-sm text-[var(--text-muted)]">No users found</p>
              )}
              {(users || [])
                .filter((u) => !groupMode || u.id !== currentUserId)
                .map(
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
                  onClick={handleStart}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading
                    ? "Creating..."
                    : groupMode
                      ? `Create Group (${selected.length})`
                      : `Start conversation${selected.length > 1 ? ` (${selected.length})` : ""}`}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
