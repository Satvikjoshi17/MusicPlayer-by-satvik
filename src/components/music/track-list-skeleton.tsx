import { Skeleton } from "@/components/ui/skeleton"

type TrackListSkeletonProps = {
    count?: number;
}

export function TrackListSkeleton({ count = 5 }: TrackListSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center p-3 gap-4">
          <Skeleton className="w-12 h-12 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="hidden md:block h-4 w-10" />
          <div className="flex items-center gap-1">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
