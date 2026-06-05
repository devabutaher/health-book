import { Skeleton } from "@/components/ui/skeleton";

export default function StoriesLoading() {
  return (
    <div className="mx-auto max-w-[600px]">
      <div className="mb-4">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="size-12 rounded-2xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="h-44 w-28 rounded-2xl" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
      <div className="mt-8 border-t border-[var(--border-subtle)] pt-6">
        <div className="mb-6">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
