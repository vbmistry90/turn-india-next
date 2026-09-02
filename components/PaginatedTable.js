import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import TableSkeleton from "@/components/skeletons/TableSkeleton";

/**
 * columns: [{ key, label, render?(row) }]
 * pagination: { page, limit, total, totalPages }
 */
export default function PaginatedTable({
  columns,
  rows,
  pagination,
  onPageChange,
  isLoading,
  emptyMessage = "No records found.",
}) {
  const { page = 1, totalPages = 1, total = 0, limit = 10 } = pagination || {};

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-ink-100 text-sm">
          <thead className="bg-ink-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-semibold text-ink-500 uppercase tracking-wide text-xs whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {isLoading ? (
              <TableSkeleton columns={columns.length} rows={Math.min(limit, 6)} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-ink-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row._id || row.id} className="hover:bg-ink-50/60">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-ink-700 whitespace-nowrap">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-ink-100 bg-white">
        <span className="text-xs text-ink-500">
          {isLoading ? (
            <span className="inline-block h-3 w-24 bg-ink-200/70 rounded animate-pulse" />
          ) : total === 0 ? (
            "0 results"
          ) : (
            `Showing ${startItem}–${endItem} of ${total} results`
          )}
        </span>

        <div className="flex items-center gap-1">
          <button
            className="p-1.5 rounded-md border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
          >
            <MdChevronLeft size={18} />
          </button>
          <span className="text-xs text-ink-600 px-2">
            Page {page} of {totalPages}
          </span>
          <button
            className="p-1.5 rounded-md border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
          >
            <MdChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
