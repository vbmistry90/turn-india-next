import { Skeleton } from "./Skeleton";

/** Mimics PaginatedTable's shape while data loads — used internally by it. */
export default function TableSkeleton({ columns = 5, rows = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton className={`h-4 ${c === 0 ? "w-28" : "w-16"}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
