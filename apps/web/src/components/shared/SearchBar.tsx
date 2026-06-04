"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, User as UserIcon, ArrowRight } from "lucide-react";
import { useSearchUsersQuery } from "@/redux/api/searchApi";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface UserHit {
  id: string;
  name: string;
  username: string;
  avatar?: string | null;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = useSearchUsersQuery(debounced, { skip: debounced.length < 2 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const users = useMemo<UserHit[]>(() => {
    const raw = data as UserHit[] | undefined;
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const showDropdown = open && query.length >= 2;

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search HealthBook..."
          className="h-9 rounded-full border-none bg-[var(--glass-bg)] pl-9 pr-14 backdrop-blur-xl ring-1 ring-[var(--glass-border)] transition-shadow focus-visible:ring-brand-teal/40 focus-visible:ring-2"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded-md border border-[var(--glass-border)] bg-[var(--bg-overlay)] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
        <AnimatePresence>
          {query && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => {
                setQuery("");
                setDebounced("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-[var(--bg-overlay)] hover:text-foreground z-10"
            >
              <X className="size-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </form>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute left-0 right-0 top-full z-50 mt-2",
              "rounded-2xl border border-[var(--glass-border)]",
              "bg-[var(--popover)]/95 backdrop-blur-2xl",
              "shadow-[var(--shadow-lg)]",
              "overflow-hidden",
            )}
          >
            {isFetching && users.length === 0 ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <Spinner />
                <span>Searching…</span>
              </div>
            ) : users.length === 0 ? (
              <Empty className="border-0 bg-transparent py-6">
                <EmptyTitle className="text-sm">No users found</EmptyTitle>
                <EmptyDescription className="text-xs">Try a different search term</EmptyDescription>
              </Empty>
            ) : (
              <>
                <div className="max-h-80 overflow-y-auto py-1">
                  {users.slice(0, 5).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        router.push(`/${u.username}`);
                        setOpen(false);
                        setQuery("");
                      }}
                      className="group flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-[var(--bg-overlay)] focus-visible:bg-[var(--bg-overlay)] focus-visible:outline-none"
                    >
                      {u.avatar ? (
                        <Image
                          src={u.avatar}
                          alt={u.name}
                          width={28}
                          height={28}
                          className="size-7 shrink-0 rounded-full object-cover ring-1 ring-[var(--border-default)]"
                        />
                      ) : (
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-teal to-brand-green text-[10px] font-bold text-white">
                          {u.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-medium">{u.name}</p>
                        <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                      <UserIcon className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
                <div className="border-t border-[var(--border-default)]">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="group flex w-full items-center justify-between gap-2 px-3 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-brand-teal/5"
                  >
                    <span>See all results for &quot;{query}&quot;</span>
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
