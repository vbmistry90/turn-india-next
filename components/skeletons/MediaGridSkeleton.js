import { Skeleton } from "./Skeleton";

export default function MediaGridSkeleton({ count = 10 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-0 overflow-hidden">
          <Skeleton className="aspect-square rounded-none" />
          <div className="p-2">
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
