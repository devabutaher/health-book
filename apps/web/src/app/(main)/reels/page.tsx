"use client";

import { ReelSkeleton } from "@/components/reels/ReelSkeleton";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useAppDispatch } from "@/hooks";
import { reelsApi } from "@/redux/api/reelsApi";

const ReelUploadModal = dynamic(
  () => import("@/components/reels/ReelUploadModal").then((m) => ({ default: m.ReelUploadModal })),
  { ssr: false },
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
  const [uploadKey, setUploadKey] = useState(0);
  const dispatch = useAppDispatch();

  const handleUploadComplete = () => {
    setUploadOpen(false);
    setUploadKey((k) => k + 1);
    dispatch(reelsApi.util.invalidateTags(["Reels"]));
  };

  return (
    <div className="relative h-[calc(100dvh-11rem)] lg:h-[calc(100dvh-8rem)]">
      <ReelsFeed key={uploadKey} onUploadClick={() => setUploadOpen(true)} isPaused={uploadOpen} />

      {/* Floating upload button */}
      <button
        onClick={() => setUploadOpen(true)}
        className="absolute top-6 right-4 z-50 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-teal to-brand-green text-white shadow-[var(--shadow-glow-teal)] transition-transform active:scale-90 hover:scale-105"
        aria-label="Upload reel"
      >
        <Plus className="size-7" />
      </button>

      <ReelUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}
