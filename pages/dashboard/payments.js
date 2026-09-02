import { useState } from "react";
import useSWR from "swr";
import DashboardLayout from "@/components/DashboardLayout";
import PaginatedTable from "@/components/PaginatedTable";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { MdAdd, MdSearch, MdEdit, MdVisibility, MdDelete } from "react-icons/md";
import { timedFetcher, timedFetch } from "@/lib/apiClient";

const fetcher = timedFetcher;

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
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);
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

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(row) {
    setEditingId(row._id);
    setForm({
      transactionId: row.transactionId,
      amount: row.amount,
      currency: row.currency || "USD",
      status: row.status,
      active: row.active,
      user: row.user,
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const url = editingId ? `/api/payments/${editingId}` : "/api/payments";
    const method = editingId ? "PATCH" : "POST";

    const res = await timedFetch(url, {
      method,
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
    setEditingId(null);
    setSaving(false);
    mutate();
  }

  async function toggleActive(row) {
    await timedFetch(`/api/payments/${row._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    });
    mutate();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this payment record? This cannot be undone.")) return;
    await timedFetch(`/api/payments/${id}`, { method: "DELETE" });
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
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-3">
          <button onClick={() => setViewing(row)} className="text-ink-500 hover:text-ink-800" title="View">
            <MdVisibility size={18} />
          </button>
          <button onClick={() => openEditModal(row)} className="text-primary-600 hover:text-primary-800" title="Edit">
            <MdEdit size={18} />
          </button>
          <button onClick={() => handleDelete(row._id)} className="text-red-500 hover:text-red-700" title="Delete">
            <MdDelete size={18} />
          </button>
        </div>
      ),
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
          <button onClick={openCreateModal} className="btn-primary whitespace-nowrap">
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

      {/* Create / Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Payment" : "Add Payment Record"}>
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
            {saving ? "Saving..." : editingId ? "Save Changes" : "Save Payment"}
          </button>
        </form>
      </Modal>

      {/* View modal */}
      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title="Payment Details">
        {viewing && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-ink-400 text-xs uppercase font-medium">Transaction ID</p>
              <p className="text-ink-800">{viewing.transactionId}</p>
            </div>
            <div>
              <p className="text-ink-400 text-xs uppercase font-medium">User</p>
              <p className="text-ink-800">{viewing.user}</p>
            </div>
            <div>
              <p className="text-ink-400 text-xs uppercase font-medium">Amount</p>
              <p className="text-ink-800">{viewing.currency || "USD"} {Number(viewing.amount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-ink-400 text-xs uppercase font-medium">Status</p>
              <StatusBadge value={viewing.status} />
            </div>
            <div>
              <p className="text-ink-400 text-xs uppercase font-medium">Active</p>
              <StatusBadge value={viewing.active ? "active" : "inactive"} />
            </div>
            <div>
              <p className="text-ink-400 text-xs uppercase font-medium">Date</p>
              <p className="text-ink-800">{new Date(viewing.createdAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
