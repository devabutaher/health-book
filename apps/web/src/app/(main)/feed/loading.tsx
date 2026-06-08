import { PostSkeletonList } from "@/components/shared/PostSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeedLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-1 h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>

      <PostSkeletonList count={3} />
    </div>
  );
}
