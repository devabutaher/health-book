import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesChatLoading() {
  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-5xl overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] md:h-[calc(100vh-8rem)]">
      <div className="hidden w-96 flex-col lg:flex">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-4">
          <Skeleton className="h-6 w-28" />
          <div className="flex gap-2">
            <Skeleton className="size-9 rounded-xl" />
            <Skeleton className="size-9 rounded-xl" />
          </div>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl p-3">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2.5 w-44" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] p-4">
          <Skeleton className="size-9 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <div className={`space-y-1.5 ${i % 2 === 0 ? "" : "items-end flex flex-col"}`}>
                <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-36"}`} />
                <Skeleton className="h-2.5 w-12" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] p-4">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="size-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
