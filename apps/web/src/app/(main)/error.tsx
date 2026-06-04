"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      console.error("[HealthBook error boundary]", error);
    }
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
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
            We hit an unexpected error loading this page. Don&apos;t worry, your data is safe. Try
            again, or head back to the feed.
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
              <Link href="/feed">
                <Home />
                Back to feed
              </Link>
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
