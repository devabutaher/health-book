import { Skeleton } from "@/components/ui/skeleton";

export default function GroupsLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>
      <div className="relative mb-6">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      <div className="mb-6 flex items-center gap-2">
        <Skeleton className="h-5 w-32" />
        <div className="h-px flex-1 bg-[var(--border-default)]" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)]"
          >
            <Skeleton className="aspect-video w-full" />
            <div className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
