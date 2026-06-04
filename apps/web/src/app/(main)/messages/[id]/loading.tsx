import { PostSkeletonList } from "@/components/shared/PostSkeleton";

export default function MainLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-24 lg:pb-12">
      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-6">
        <div className="mx-auto max-w-[600px] lg:mx-0">
          <div className="mb-6 h-12 w-48 animate-pulse rounded-xl bg-[var(--bg-overlay)]" />
          <PostSkeletonList count={3} />
        </div>
      </div>
    </div>
  );
}
