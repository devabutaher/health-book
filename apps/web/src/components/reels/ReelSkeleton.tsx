export function ReelSkeleton() {
  return (
    <div className="h-full snap-y snap-mandatory overflow-y-auto scrollbar-none">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative h-full snap-start">
          <div className="relative mx-auto h-full w-full max-w-md overflow-hidden rounded-2xl bg-black">
            <div className="absolute inset-0 animate-pulse bg-white/5" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 pt-12">
              <div className="flex items-center gap-2">
                <div className="size-8 animate-pulse rounded-full bg-white/10 ring-2 ring-white/10" />
                <div className="h-3 w-20 animate-pulse rounded-full bg-white/10" />
                <div className="ml-1 h-5 w-16 animate-pulse rounded-full border border-white/10 bg-white/10" />
              </div>
              <div className="mt-2 h-2.5 w-3/4 animate-pulse rounded-full bg-white/10" />
              <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
