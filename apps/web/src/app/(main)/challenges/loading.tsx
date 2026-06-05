import { Skeleton } from "@/components/ui/skeleton";

export default function ChallengesLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-teal/10 via-brand-blue/10 to-brand-purple/10 p-8">
        <div className="relative z-10 space-y-3">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-72" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-40 rounded-xl" />
            <Skeleton className="h-10 w-40 rounded-xl" />
          </div>
        </div>
      </div>
      <div className="relative mb-4">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      <div className="mb-6 flex gap-1">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
        ))}
      </div>
      <div className="mb-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className={`h-8 rounded-full ${i === 0 ? "w-16" : "w-24"}`} />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)]">
            <Skeleton className="aspect-video w-full" />
            <div className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
