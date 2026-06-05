import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-[700px]">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        {[1, 2, 3, 4, 5].map((section) => (
          <div key={section} className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="size-8 rounded-xl" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="space-y-5">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </div>
        ))}

        <div className="rounded-2xl border border-red-500/20 bg-[var(--bg-elevated)] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="size-8 rounded-xl" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
