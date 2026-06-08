import { Skeleton } from "@/components/ui/skeleton";

export default function GroupMembersLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)]">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-[var(--border-subtle)] p-4 last:border-b-0"
          >
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
