"use client"

import { useState, useCallback } from "react"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { resetApiCache } from "@/redux/store"

export default function RefreshButton() {
  const [spinning, setSpinning] = useState(false)

  const handleRefresh = useCallback(() => {
    if (spinning) return
    setSpinning(true)
    resetApiCache()
    setTimeout(() => setSpinning(false), 1200)
  }, [spinning])

  return (
    <button
      onClick={handleRefresh}
      disabled={spinning}
      aria-label="Refresh all data"
      className={cn(
        "flex size-9 items-center justify-center rounded-xl",
        "text-muted-foreground transition-colors",
        "hover:bg-[var(--bg-overlay)] hover:text-foreground",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40",
      )}
    >
      <RefreshCw className={cn("size-5", spinning && "animate-spin")} />
    </button>
  )
}
