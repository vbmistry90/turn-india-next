import { Skeleton } from "./Skeleton";

export default function ChartSkeleton({ height = "h-72", title = true }) {
  return (
    <div className="card">
      {title && (
        <div className="mb-4 space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      )}
      <Skeleton className={`w-full ${height} rounded-lg`} />
    </div>
  );
}
