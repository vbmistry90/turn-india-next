import { Skeleton } from "./Skeleton";

/** Full-page shell shown while the auth/session check is still resolving. */
export default function DashboardShellSkeleton() {
  return (
    <div className="min-h-screen bg-ink-50 flex">
      <div className="hidden lg:block w-64 bg-ink-900 shrink-0" />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-16 bg-white border-b border-ink-100 flex items-center px-8">
          <Skeleton className="h-5 w-32" />
        </div>
        <main className="flex-1 p-4 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card flex items-start gap-4">
                <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-lg" />
        </main>
      </div>
    </div>
  );
}
