import useSWR from "swr";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
import { MdRefresh, MdOutlineMonitorHeart, MdCheckCircle, MdError } from "react-icons/md";
import StatCardsSkeleton from "@/components/skeletons/StatCardsSkeleton";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { timedFetcher, timedFetch } from "@/lib/apiClient";

const fetcher = timedFetcher;

function statusToBadge(status) {
  if (status === "up") return "active";
  if (status === "down" || status === "seems_down") return "failed";
  if (status === "paused") return "archived";
  return "pending";
}

export default function HealthPage() {
  const { data, isLoading, error, mutate } = useSWR("/api/health/monitors", fetcher, {
    shouldRetryOnError: false,
    refreshInterval: 60000, // auto-refresh every 60s
  });
  const { data: eventsData } = useSWR("/api/health/events?limit=15", fetcher);

  const monitors = data?.data || [];
  const summary = data?.summary;
  const events = eventsData?.data || [];

  return (
    <DashboardLayout title="Health Monitor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-ink-800">UptimeRobot Monitors</h2>
            <p className="text-sm text-ink-500">Live status pulled from your UptimeRobot account · auto-refreshes every 60s</p>
          </div>
          <button onClick={() => mutate()} className="btn-secondary">
            <MdRefresh size={18} /> Refresh
          </button>
        </div>

        {!data?.success && (data?.message || error) && (
          <div className="card border-amber-200 bg-amber-50 text-amber-800 text-sm">
            <p className="font-medium mb-1">UptimeRobot isn&apos;t connected yet</p>
            <p>{data?.message || "Set UPTIMEROBOT_API_KEY in your .env.local to see live monitor data here."}</p>
          </div>
        )}

        {isLoading ? (
          <StatCardsSkeleton count={3} />
        ) : summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                <MdOutlineMonitorHeart size={20} />
              </div>
              <div>
                <p className="text-sm text-ink-500">Total Monitors</p>
                <p className="text-xl font-semibold text-ink-800">{summary.total}</p>
              </div>
            </div>
            <div className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <MdCheckCircle size={20} />
              </div>
              <div>
                <p className="text-sm text-ink-500">Up</p>
                <p className="text-xl font-semibold text-ink-800">{summary.up}</p>
              </div>
            </div>
            <div className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <MdError size={20} />
              </div>
              <div>
                <p className="text-sm text-ink-500">Down</p>
                <p className="text-xl font-semibold text-ink-800">{summary.down}</p>
              </div>
            </div>
          </div>
        )}

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-100 text-sm">
              <thead className="bg-ink-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-ink-500 uppercase text-xs">Monitor</th>
                  <th className="px-4 py-3 text-left font-semibold text-ink-500 uppercase text-xs">URL</th>
                  <th className="px-4 py-3 text-left font-semibold text-ink-500 uppercase text-xs">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-ink-500 uppercase text-xs">Uptime</th>
                  <th className="px-4 py-3 text-left font-semibold text-ink-500 uppercase text-xs">Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {isLoading ? (
                  <TableSkeleton columns={5} rows={4} />
                ) : monitors.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-400">No monitors to display.</td></tr>
                ) : (
                  monitors.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 text-ink-700 font-medium whitespace-nowrap">{m.name}</td>
                      <td className="px-4 py-3 text-ink-500 max-w-xs truncate">{m.url}</td>
                      <td className="px-4 py-3"><StatusBadge value={statusToBadge(m.status)} /></td>
                      <td className="px-4 py-3 text-ink-700">{m.uptimeRatio ? `${Number(m.uptimeRatio).toFixed(2)}%` : "—"}</td>
                      <td className="px-4 py-3 text-ink-700">{m.responseTimeMs ? `${m.responseTimeMs} ms` : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-ink-800 mb-3 text-sm">Recent Alert Events</h3>
          <p className="text-xs text-ink-400 mb-4">
            Populated from UptimeRobot webhook alerts (Up/Down events) — see README for webhook setup.
          </p>
          {events.length === 0 ? (
            <p className="text-sm text-ink-400">No alert events recorded yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {events.map((ev) => (
                <li key={ev._id} className="flex items-center justify-between border-b border-ink-100 pb-2 last:border-0">
                  <div>
                    <span className="font-medium text-ink-700">{ev.monitorName}</span>{" "}
                    <span className="text-ink-400">— {ev.reason}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge value={ev.status === "up" ? "active" : "failed"} />
                    <span className="text-ink-400 text-xs">{new Date(ev.createdAt).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
