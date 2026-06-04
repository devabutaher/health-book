"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      console.error("[HealthBook root error]", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg-base)] p-4">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <GlassCard variant="noise" className="flex flex-col items-center p-10 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-brand-coral/20 to-brand-amber/20 blur-2xl" />
            <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-coral to-brand-amber shadow-[0_0_40px_rgba(244,63,94,0.4)]">
              <AlertTriangle className="size-10 text-white" />
            </div>
          </div>

          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Something went wrong
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            An unexpected error occurred. Please try again or return to the home page.
          </p>
          {error.digest && (
            <p className="mt-2 text-[10px] font-mono text-muted-foreground/60">
              ref: {error.digest}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <Button onClick={reset} variant="gradient" size="lg">
              <RotateCcw />
              Try again
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">
                <Home />
                Home
              </Link>
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
