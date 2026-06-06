"use client";

import { ReelSkeleton } from "@/components/reels/ReelSkeleton";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { useState } from "react";

const ReelUploadModal = dynamic(
  () => import("@/components/reels/ReelUploadModal").then(m => ({ default: m.ReelUploadModal })),
  { ssr: false }
);
const ReelsFeed = dynamic(
  () => import("@/components/reels/ReelsFeed").then((m) => ({ default: m.ReelsFeed })),
  {
    ssr: false,
    loading: () => <ReelSkeleton />,
  },
);

export default function ReelsPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);

  return (
    <ProtectedRoute>
      <div className="relative h-[calc(100dvh-11rem)] lg:h-[calc(100dvh-8rem)]">
        <ReelsFeed key={refreshFlag} onUploadClick={() => setUploadOpen(true)} />

        {/* Floating upload button */}
        <button
          onClick={() => setUploadOpen(true)}
          className="absolute top-6 right-4 z-50 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-teal to-brand-green text-white shadow-[var(--shadow-glow-teal)] transition-transform active:scale-90 hover:scale-105"
          aria-label="Upload reel"
        >
          <Plus className="size-7" />
        </button>

        <ReelUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUploadComplete={() => setRefreshFlag(f => f + 1)} />
      </div>
    </ProtectedRoute>
  );
}
