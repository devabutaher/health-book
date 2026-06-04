"use client";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { use } from "react";
const ReelDetail = dynamic(
  () => import("@/components/reels/ReelDetail").then((m) => ({ default: m.ReelDetail })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100dvh-11rem)] lg:h-[calc(100dvh-8rem)] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-white/50" />
      </div>
    ),
  },
);

export default function ReelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <ReelDetail id={id} />
    </ProtectedRoute>
  );
}
