import { Skeleton } from "@/components/ui/skeleton";

export default function PostLoading() {
  return (
    <div className="mx-auto max-w-[600px]">
      <div className="mb-4 h-6 w-32 animate-pulse rounded bg-[var(--bg-overlay)]" />
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4">
        <div className="mb-4 flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="mb-3 h-4 w-full" />
        <Skeleton className="mb-3 h-4 w-2/3" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}
