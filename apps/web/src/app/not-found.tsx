"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

export default function GlobalNotFound() {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute inset-0 bg-mesh-1 opacity-50" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <GlassCard variant="noise" className="flex flex-col items-center p-10 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-brand-purple/20 to-brand-teal/20 blur-2xl" />
            <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-teal via-brand-blue to-brand-purple shadow-[0_0_40px_rgba(20,184,166,0.4)]">
              <Compass className="size-10 text-white" />
            </div>
          </div>

          <h1 className="font-display text-6xl font-extrabold tracking-tight">
            <span className="text-gradient-primary">404</span>
          </h1>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">Page not found</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            The page you&apos;re looking for has wandered off. It might have been moved, deleted, or
            never existed.
          </p>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="gradient" size="lg">
              <Link href="/feed">
                <Home />
                Back to feed
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/explore">
                <Search />
                Explore
              </Link>
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
