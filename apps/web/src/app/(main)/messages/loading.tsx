import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-5xl overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] md:h-[calc(100vh-8rem)]">
      <div className="flex w-full flex-col lg:w-96">
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
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2.5 w-10" />
                </div>
                <Skeleton className="h-2.5 w-44" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden flex-1 items-center justify-center lg:flex">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
      </div>
    </div>
  );
}
