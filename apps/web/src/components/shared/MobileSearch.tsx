"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, X, User as UserIcon, ArrowRight } from "lucide-react"
import { useSearchUsersQuery } from "@/redux/api/searchApi"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { motion, AnimatePresence } from "framer-motion"

interface UserHit {
  id: string
  name: string
  username: string
  avatar?: string | null
}

export default function MobileSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handler)
      return () => document.removeEventListener("mousedown", handler)
    }
  }, [open])

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data, isFetching } = useSearchUsersQuery(debounced, { skip: debounced.length < 2 })

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
      setOpen(false)
    }
  }

  const users = useMemo<UserHit[]>(() => {
    const raw = data as UserHit[] | undefined
    return Array.isArray(raw) ? raw : []
  }, [data])

  const showResults = query.length >= 2

  return (
    <div ref={dropdownRef} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Search"
        className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-[var(--bg-overlay)] hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40"
      >
        <Search className="size-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed left-3 right-3 top-[60px] z-50 sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 rounded-2xl border border-[var(--glass-border)] bg-[var(--popover)] backdrop-blur-2xl shadow-[var(--shadow-lg)] overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search HealthBook..."
                  className="h-10 w-full rounded-full border-none bg-[var(--glass-bg)] pl-9 pr-9 backdrop-blur-xl ring-1 ring-[var(--glass-border)] transition-shadow focus-visible:ring-brand-teal/40 focus-visible:ring-2"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("")
                      setDebounced("")
                      inputRef.current?.focus()
                    }}
                    aria-label="Clear search"
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-[var(--bg-overlay)] hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </form>

            <div className="max-h-80 overflow-y-auto">
              {showResults ? (
                isFetching && users.length === 0 ? (
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
                  <div className="py-1">
                    {users.slice(0, 10).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          router.push(`/${u.username}`)
                          setOpen(false)
                        }}
                        className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-overlay)] focus-visible:bg-[var(--bg-overlay)] focus-visible:outline-none"
                      >
                        {u.avatar ? (
                          <Image
                            src={u.avatar}
                            alt={u.name}
                            width={32}
                            height={32}
                            className="size-8 shrink-0 rounded-full object-cover ring-1 ring-[var(--border-default)]"
                          />
                        ) : (
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-teal to-brand-green text-xs font-bold text-white">
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
                    {query && (
                      <div className="border-t border-[var(--border-subtle)] px-4 py-2.5">
                        <button
                          type="button"
                          onClick={handleSubmit}
                          className="group flex w-full items-center justify-between gap-2 text-xs font-medium text-primary transition-colors hover:text-brand-teal"
                        >
                          <span>See all results for &quot;{query}&quot;</span>
                          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-[var(--bg-overlay)]">
                    <Search className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Search for users</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
