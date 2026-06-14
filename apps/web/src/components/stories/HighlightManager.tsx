"use client";

import Image from "next/image";
import { useState } from "react";
import { X, Plus, Trash2, Pencil, Check } from "lucide-react";
import {
  useGetHighlightsQuery,
  useCreateHighlightMutation,
  useUpdateHighlightMutation,
  useDeleteHighlightMutation,
} from "@/redux/api/highlightsApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { toast } from "sonner";

export function HighlightManager({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect?: (highlightId: string) => void;
}) {
  const { data: highlights, isLoading, isError, refetch } = useGetHighlightsQuery();
  const [createHighlight, { isLoading: isCreating }] = useCreateHighlightMutation();
  const [updateHighlight] = useUpdateHighlightMutation();
  const [deleteHighlight] = useDeleteHighlightMutation();
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const result = await createHighlight({ title: newTitle.trim() }).unwrap();
      toast.success("Highlight created!");
      setNewTitle("");
      onSelect?.(result.id);
    } catch {
      toast.error("Failed to create highlight");
    }
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      await updateHighlight({ id, title: editTitle.trim() }).unwrap();
      toast.success("Highlight renamed");
      setEditingId(null);
    } catch {
      toast.error("Failed to rename");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHighlight(id).unwrap();
      toast.success("Highlight deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <GlassCard
        variant="elevated"
        className="w-full max-w-md p-6"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Manage Highlights</h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-[var(--bg-overlay)]"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Create new */}
        <form onSubmit={handleCreate} className="mb-6 flex gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New highlight name..."
            maxLength={50}
            className="flex-1"
          />
          <Button
            type="submit"
            variant="gradient"
            size="sm"
            disabled={!newTitle.trim() || isCreating}
          >
            <Plus className="size-4" />
            {isCreating ? "..." : "Create"}
          </Button>
        </form>

        {/* Existing highlights */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="size-6 animate-spin rounded-full border-2 border-brand-teal border-t-transparent" />
            </div>
          ) : isError ? (
            <div className="py-4 text-center">
              <p className="text-sm text-red-400">Failed to load highlights</p>
              <button
                onClick={refetch}
                className="mt-2 text-xs text-brand-teal underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          ) : !highlights || highlights.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No highlights yet. Create one to start saving stories.
            </p>
          ) : (
            highlights.map((hl) => (
              <div
                key={hl.id}
                className="flex items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-overlay)] p-3 transition-colors"
              >
                {editingId === hl.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={50}
                      autoFocus
                      className="flex-1"
                    />
                    <button
                      onClick={() => handleRename(hl.id)}
                      className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-r from-brand-teal to-brand-green text-white"
                    >
                      <Check className="size-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex size-8 items-center justify-center rounded-lg border border-[var(--border-default)] text-muted-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-teal to-brand-green text-sm font-bold text-white">
                      {hl.coverUrl ? (
                        <Image
                          src={hl.coverUrl}
                          alt={hl.title}
                          className="size-full object-cover"
                          width={40}
                          height={40}
                        />
                      ) : (
                        hl.title.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{hl.title}</p>
                      <p className="text-xs text-muted-foreground">{hl.items.length} items</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingId(hl.id);
                        setEditTitle(hl.title);
                      }}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[var(--bg-subtle)]"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(hl.id)}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="size-4" />
                    </button>
                    {onSelect && (
                      <Button variant="gradient" size="sm" onClick={() => onSelect(hl.id)}>
                        Select
                      </Button>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
}
