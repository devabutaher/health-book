import { Skeleton } from "@/components/ui/skeleton";

export default function GroupDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="space-y-4 px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="-mt-12 size-16 rounded-full ring-4 ring-[var(--bg-base)] sm:size-20" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4">
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
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4">
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
      </div>
    </div>
  );
}
