import { Skeleton } from "@/components/ui/skeleton";

export default function MyBookLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        <Skeleton className="size-40 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-7 w-32" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
