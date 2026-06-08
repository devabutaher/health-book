import { Skeleton } from "@/components/ui/skeleton";

export default function SavedLoading() {
  return (
    <div className="mx-auto max-w-[600px]">
      <div className="mb-4">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="size-12 rounded-2xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <Skeleton className="mt-3 aspect-video w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
