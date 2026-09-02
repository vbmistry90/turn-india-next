import { Skeleton } from "./Skeleton";

export default function ProfileSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card">
          <div className="flex items-start gap-3 mb-4">
            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="h-4 w-full max-w-xs" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
