import { Skeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-4 w-24" />
      
      {/* Team Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-72" />

      {/* Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

