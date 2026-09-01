import useSWR from "swr";
import DashboardLayout from "@/components/DashboardLayout";
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
} from "recharts";
import {
  MdWarningAmber,
  MdBolt,
  MdOutlineVideoLibrary,
  MdOutlinePayments,
} from "react-icons/md";

const fetcher = (url) => fetch(url, { credentials: "include" }).then((r) => r.json());

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

export default function DashboardOverview() {
  const { data: ecoData, isLoading: ecoLoading } = useSWR("/api/eco-stats", fetcher);
  const { data: videoData } = useSWR("/api/videos?limit=1", fetcher);
  const { data: paymentData } = useSWR("/api/payments?limit=1", fetcher);

  const toxic = ecoData?.data?.toxicMaterials || [];
  const energy = ecoData?.data?.energyWaste || [];
  const summary = ecoData?.data?.summary || { totalToxic: 0, totalEnergyWaste: 0 };

  // merge by month for the line chart
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

  return (
    <DashboardLayout title="Overview">
      <div className="space-y-6">
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

        {/* Eco system charts */}
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

        {!ecoLoading && toxic.length === 0 && energy.length === 0 && (
          <div className="text-sm text-ink-400 text-center py-4">
            No eco-system data yet. Run <code className="bg-ink-100 px-1.5 py-0.5 rounded">npm run seed</code> to load sample data.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
