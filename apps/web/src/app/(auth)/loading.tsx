import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--card-bg)] p-8">
          <div className="mb-6 flex flex-col items-center gap-2">
            <Skeleton className="size-12 rounded-2xl" />
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex flex-col gap-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-default)]" />
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="mx-auto h-4 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}
