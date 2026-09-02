import useSWR from "swr";
import DashboardLayout from "@/components/DashboardLayout";
import StatCardsSkeleton from "@/components/skeletons/StatCardsSkeleton";
import ChartSkeleton from "@/components/skeletons/ChartSkeleton";
import { timedFetcher } from "@/lib/apiClient";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  MdWarningAmber,
  MdBolt,
  MdOutlineVideoLibrary,
  MdOutlinePayments,
  MdOutlineMailOutline,
  MdOutlinePeople,
  MdOutlineMonitorHeart,
} from "react-icons/md";

const fetcher = timedFetcher;

const PIE_COLORS = ["#16a34a", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7", "#64748b"];

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-ink-500">{label}</p>
        <p className="text-2xl font-semibold text-ink-800">{value}</p>
        {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MiniPie({ title, data, isLoading }) {
  const hasData = data.some((d) => d.value > 0);
  return (
    <div className="card">
      <h3 className="font-semibold text-ink-800 mb-3 text-sm">{title}</h3>
      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border-8 border-ink-100 border-t-ink-300 animate-spin" />
        </div>
      ) : hasData ? (
        <div className="h-48 flex items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-ink-400 text-sm">No data yet</div>
      )}
    </div>
  );
}

export default function DashboardOverview() {
  const { data: ecoData, isLoading: ecoLoading } = useSWR("/api/eco-stats", fetcher);
  const { data: videoData, isLoading: videoLoading } = useSWR("/api/videos?limit=100", fetcher);
  const { data: paymentData, isLoading: paymentLoading } = useSWR("/api/payments?limit=100", fetcher);
  const { data: contactData, isLoading: contactLoading } = useSWR("/api/contacts?limit=100", fetcher);
  const { data: healthData } = useSWR("/api/health/monitors", fetcher, { shouldRetryOnError: false });

  const statsLoading = ecoLoading || videoLoading || paymentLoading || contactLoading;
  const chartsLoading = ecoLoading;
  const piesLoading = videoLoading || paymentLoading || contactLoading;

  const toxic = ecoData?.data?.toxicMaterials || [];
  const energy = ecoData?.data?.energyWaste || [];
  const summary = ecoData?.data?.summary || { totalToxic: 0, totalEnergyWaste: 0 };

  const monthMap = {};
  toxic.forEach((t) => {
    monthMap[t.month] = { ...(monthMap[t.month] || {}), month: t.month, toxic: (monthMap[t.month]?.toxic || 0) + t.value };
  });
  energy.forEach((e) => {
    monthMap[e.month] = { ...(monthMap[e.month] || {}), month: e.month, energy: (monthMap[e.month]?.energy || 0) + e.value };
  });
  const trendData = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

  const toxicByLabel = toxic.reduce((acc, t) => {
    const found = acc.find((a) => a.label === t.label);
    if (found) found.value += t.value;
    else acc.push({ label: t.label, value: t.value });
    return acc;
  }, []);

  const energyByLabel = energy.reduce((acc, e) => {
    const found = acc.find((a) => a.label === e.label);
    if (found) found.value += e.value;
    else acc.push({ label: e.label, value: e.value });
    return acc;
  }, []);

  function countBy(items, key) {
    const counts = {};
    (items || []).forEach((item) => {
      counts[item[key]] = (counts[item[key]] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }

  const videosByStatus = countBy(videoData?.data, "status");
  const paymentsByStatus = countBy(paymentData?.data, "status");
  const contactsByStatus = countBy(contactData?.data, "status");

  const healthSummary = healthData?.summary;

  return (
    <DashboardLayout title="Overview">
      <div className="space-y-6">
        {statsLoading ? (
          <>
            <StatCardsSkeleton count={4} />
            <StatCardsSkeleton count={4} />
          </>
        ) : (
          <>
            {/* Top stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={MdWarningAmber}
                label="Toxic Materials (total)"
                value={`${summary.totalToxic.toLocaleString()} kg`}
                sub="Across all tracked substances"
                color="bg-red-100 text-red-600"
              />
              <StatCard
                icon={MdBolt}
                label="Energy Waste (total)"
                value={`${summary.totalEnergyWaste.toLocaleString()} kWh`}
                sub="Across all tracked sources"
                color="bg-amber-100 text-amber-600"
              />
              <StatCard
                icon={MdOutlineVideoLibrary}
                label="Project Videos"
                value={videoData?.pagination?.total ?? "—"}
                sub="Total uploaded"
                color="bg-primary-100 text-primary-600"
              />
              <StatCard
                icon={MdOutlinePayments}
                label="Payments Recorded"
                value={paymentData?.pagination?.total ?? "—"}
                sub={`$${(paymentData?.totalRevenue ?? 0).toLocaleString()} revenue`}
                color="bg-blue-100 text-blue-600"
              />
            </div>

            {/* Second row of stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={MdOutlineMailOutline}
                label="Contact Inquiries"
                value={contactData?.pagination?.total ?? "—"}
                sub={`${contactsByStatus.find((c) => c.name === "new")?.value || 0} unread`}
                color="bg-purple-100 text-purple-600"
              />
              <StatCard
                icon={MdOutlineMonitorHeart}
                label="Monitored Services"
                value={healthSummary?.total ?? "—"}
                sub={healthSummary ? `${healthSummary.up} up · ${healthSummary.down} down` : "UptimeRobot not configured"}
                color="bg-teal-100 text-teal-600"
              />
              <StatCard
                icon={MdOutlinePeople}
                label="Published Videos"
                value={videosByStatus.find((v) => v.name === "published")?.value || 0}
                sub="Currently live"
                color="bg-green-100 text-green-600"
              />
              <StatCard
                icon={MdOutlinePayments}
                label="Successful Payments"
                value={paymentsByStatus.find((p) => p.name === "success")?.value || 0}
                sub="Out of total recorded"
                color="bg-indigo-100 text-indigo-600"
              />
            </div>
          </>
        )}

        {/* Eco system charts */}
        {chartsLoading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartSkeleton height="h-72" />
            <ChartSkeleton height="h-72" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-semibold text-ink-800 mb-1">Toxic Materials by Type</h2>
              <p className="text-xs text-ink-400 mb-4">Cumulative measured quantity (kg)</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={toxicByLabel}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} name="Toxic materials (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2 className="font-semibold text-ink-800 mb-1">Energy Waste by Source</h2>
              <p className="text-xs text-ink-400 mb-4">Cumulative measured quantity (kWh)</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={energyByLabel}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Energy waste (kWh)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {chartsLoading ? (
          <ChartSkeleton height="h-72" />
        ) : (
          <div className="card">
            <h2 className="font-semibold text-ink-800 mb-1">Monthly Trend</h2>
            <p className="text-xs text-ink-400 mb-4">Toxic materials vs. energy waste over time</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="toxic" stroke="#ef4444" name="Toxic Materials" strokeWidth={2} />
                  <Line type="monotone" dataKey="energy" stroke="#f59e0b" name="Energy Waste" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Breakdown pies */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MiniPie title="Videos by Status" data={videosByStatus} isLoading={piesLoading} />
          <MiniPie title="Payments by Status" data={paymentsByStatus} isLoading={piesLoading} />
          <MiniPie title="Inquiries by Status" data={contactsByStatus} isLoading={piesLoading} />
        </div>

        {!ecoLoading && toxic.length === 0 && energy.length === 0 && (
          <div className="text-sm text-ink-400 text-center py-4">
            No eco-system data yet. Run <code className="bg-ink-100 px-1.5 py-0.5 rounded">npm run seed</code> to load sample data.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
