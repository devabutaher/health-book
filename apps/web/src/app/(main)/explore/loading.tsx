import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreLoading() {
  return (
    <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-6">
      <div className="mx-auto max-w-[600px] lg:mx-0">
        <div className="mb-6 h-12 w-48 animate-pulse rounded-xl bg-[var(--bg-overlay)]" />
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4"
            >
              <div className="mb-4 flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="mb-3 h-4 w-full" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
