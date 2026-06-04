import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="mx-auto max-w-[600px]">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-40 animate-pulse rounded-xl bg-[var(--bg-overlay)]" />
          <div className="h-4 w-56 animate-pulse rounded bg-[var(--bg-overlay)]" />
        </div>
      </div>
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)]">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-start gap-3 border-b border-[var(--border-subtle)] px-4 py-3 last:border-b-0"
          >
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
