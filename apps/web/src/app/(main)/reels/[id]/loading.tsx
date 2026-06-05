import { Skeleton } from "@/components/ui/skeleton";

export default function ReelDetailLoading() {
  return (
    <div className="flex h-[calc(100dvh-11rem)] lg:h-[calc(100dvh-8rem)] items-center justify-center">
      <div className="relative h-[90%] w-full max-w-sm overflow-hidden rounded-2xl">
        <Skeleton className="size-full" />
        <div className="absolute bottom-0 left-0 right-0 space-y-2 p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-3 w-56" />
          <div className="flex gap-2">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
