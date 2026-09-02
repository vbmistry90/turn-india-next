import { Skeleton } from "./Skeleton";

export default function FormCardSkeleton({ fields = 4 }) {
  return (
    <div className="card max-w-2xl">
      <div className="flex items-center gap-3 mb-5">
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <div className="space-y-5">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-9 w-40 mt-6" />
    </div>
  );
}
