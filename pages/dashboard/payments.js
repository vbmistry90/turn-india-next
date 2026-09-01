import { useState } from "react";
import useSWR from "swr";
import DashboardLayout from "@/components/DashboardLayout";
import PaginatedTable from "@/components/PaginatedTable";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { MdAdd, MdSearch } from "react-icons/md";

const fetcher = (url) => fetch(url, { credentials: "include" }).then((r) => r.json());

const emptyForm = {
  transactionId: "",
  amount: "",
  currency: "USD",
  status: "pending",
  active: true,
  user: "",
};

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const query = new URLSearchParams({ page, limit: 8, search, status: statusFilter }).toString();
  const { data, isLoading, mutate } = useSWR(`/api/payments?${query}`, fetcher);

  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0, limit: 8 };
  const totalRevenue = data?.totalRevenue || 0;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      setError(result.message || "Failed to save payment");
      setSaving(false);
      return;
    }

    setModalOpen(false);
    setForm(emptyForm);
    setSaving(false);
    mutate();
  }

  async function toggleActive(row) {
    await fetch(`/api/payments/${row._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    });
    mutate();
  }

  const columns = [
    { key: "transactionId", label: "Transaction ID" },
    { key: "user", label: "User" },
    {
      key: "amount",
      label: "Amount",
      render: (row) => `${row.currency || "USD"} ${Number(row.amount).toLocaleString()}`,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge value={row.status} />,
    },
    {
      key: "active",
      label: "Active",
      render: (row) => (
        <button onClick={() => toggleActive(row)}>
          <StatusBadge value={row.active ? "active" : "inactive"} />
        </button>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
  ];

  return (
    <DashboardLayout title="Payments">
      <div className="space-y-4">
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-500">Total revenue (successful transactions)</p>
            <p className="text-2xl font-semibold text-ink-800">${totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
              <input
                className="input-field pl-9"
                placeholder="Search transaction / user..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              className="input-field sm:w-44"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <button onClick={() => setModalOpen(true)} className="btn-primary whitespace-nowrap">
            <MdAdd size={18} /> Add Payment
          </button>
        </div>

        <PaginatedTable
          columns={columns}
          rows={rows}
          pagination={pagination}
          onPageChange={setPage}
          isLoading={isLoading}
          emptyMessage="No payment records yet."
        />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Payment Record">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Transaction ID</label>
            <input name="transactionId" required className="input-field" value={form.transactionId} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">User</label>
            <input name="user" required className="input-field" value={form.user} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Amount</label>
              <input type="number" step="0.01" name="amount" required className="input-field" value={form.amount} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Currency</label>
              <input name="currency" className="input-field" value={form.currency} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Status</label>
            <select name="status" className="input-field" value={form.status} onChange={handleChange}>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="rounded border-ink-300 text-primary-600" />
            Active
          </label>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? "Saving..." : "Save Payment"}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
