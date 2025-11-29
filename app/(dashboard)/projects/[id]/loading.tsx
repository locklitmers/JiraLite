import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-5" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </div>

      {/* Kanban skeleton */}
      <div className="flex-1 p-6">
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-80 flex-shrink-0">
              <Skeleton className="h-10 mb-2 rounded-lg" />
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-24 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

