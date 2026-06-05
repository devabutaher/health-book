import { Skeleton } from "@/components/ui/skeleton";

export default function ReelsLoading() {
  return (
    <div className="relative h-[calc(100dvh-11rem)] lg:h-[calc(100dvh-8rem)]">
      <div className="flex h-full items-center justify-center gap-4 overflow-hidden px-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative h-[90%] w-72 shrink-0 overflow-hidden rounded-2xl">
            <Skeleton className="size-full" />
            <div className="absolute bottom-0 left-0 right-0 space-y-2 p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute top-6 right-4">
        <Skeleton className="size-14 rounded-2xl" />
      </div>
    </div>
  );
}
