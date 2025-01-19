import { Skeleton } from "./skeleton";

export function StatsResultSkeleton() {
  return (
    <div className="text-sm text-zinc-400 flex flex-col items-end gap-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-48" />
    </div>
  );
}
