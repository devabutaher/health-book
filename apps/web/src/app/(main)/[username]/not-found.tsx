"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserX, ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

export default function ProfileNotFound() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/feed"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to feed
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <GlassCard variant="noise" className="flex flex-col items-center p-10 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-brand-coral/20 to-brand-purple/20 blur-2xl" />
            <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-coral to-brand-purple shadow-[0_0_40px_rgba(244,63,94,0.4)]">
              <UserX className="size-10 text-white" />
            </div>
          </div>

          <h1 className="font-display text-2xl font-extrabold tracking-tight">User not found</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            We couldn&apos;t find a profile with that username. They may have deactivated their
            account or changed their handle.
          </p>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="gradient" size="lg">
              <Link href="/explore">
                <Users />
                Discover people
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/feed">
                <ArrowLeft />
                Back to feed
              </Link>
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
