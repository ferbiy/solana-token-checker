import { Skeleton } from "./skeleton";

export function ResultSkeleton() {
  return (
    <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-900">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <div className="mt-2 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
