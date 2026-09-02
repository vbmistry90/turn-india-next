import { useState } from "react";
import useSWR from "swr";
import DashboardLayout from "@/components/DashboardLayout";
import PaginatedTable from "@/components/PaginatedTable";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { MdSearch, MdVisibility, MdDelete, MdEdit } from "react-icons/md";
import { timedFetcher, timedFetch } from "@/lib/apiClient";

const fetcher = timedFetcher;

export default function ContactsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const query = new URLSearchParams({ page, limit: 8, search, status: statusFilter }).toString();
  const { data, isLoading, mutate } = useSWR(`/api/contacts?${query}`, fetcher);

  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0, limit: 8 };

  async function openInquiry(row) {
    setViewing(row);
    if (row.status === "new") {
      await timedFetch(`/api/contacts/${row._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "read" }),
      });
      mutate();
    }
  }

  function openEdit(row) {
    setEditing(row);
    setEditForm({
      name: row.name,
      email: row.email,
      phone: row.phone || "",
      subject: row.subject || "",
      message: row.message,
      status: row.status,
    });
    setError("");
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await timedFetch(`/api/contacts/${editing._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      setError(result.message || "Failed to update inquiry");
      setSaving(false);
      return;
    }

    setSaving(false);
    setEditing(null);
    mutate();
  }

  async function markResolved(id) {
    await timedFetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    setViewing(null);
    mutate();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this inquiry?")) return;
    await timedFetch(`/api/contacts/${id}`, { method: "DELETE" });
    mutate();
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "subject", label: "Subject" },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge value={row.status} />,
    },
    {
      key: "createdAt",
      label: "Received",
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-3">
          <button onClick={() => openInquiry(row)} className="text-ink-500 hover:text-ink-800" title="View">
            <MdVisibility size={18} />
          </button>
          <button onClick={() => openEdit(row)} className="text-primary-600 hover:text-primary-800" title="Edit">
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
    <DashboardLayout title="Contact Inquiries">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-72">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
            <input
              className="input-field pl-9"
              placeholder="Search name, email, subject..."
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
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <PaginatedTable
          columns={columns}
          rows={rows}
          pagination={pagination}
          onPageChange={setPage}
          isLoading={isLoading}
          emptyMessage="No inquiries yet."
        />
      </div>

      {/* View modal */}
      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title="Inquiry Details">
        {viewing && (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-ink-400 text-xs uppercase font-medium">From</p>
              <p className="text-ink-800 font-medium">{viewing.name}</p>
              <p className="text-ink-500">{viewing.email}</p>
              {viewing.phone && <p className="text-ink-500">{viewing.phone}</p>}
            </div>
            <div>
              <p className="text-ink-400 text-xs uppercase font-medium">Subject</p>
              <p className="text-ink-800">{viewing.subject}</p>
            </div>
            <div>
              <p className="text-ink-400 text-xs uppercase font-medium">Message</p>
              <p className="text-ink-700 whitespace-pre-wrap">{viewing.message}</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <StatusBadge value={viewing.status} />
              {viewing.status !== "resolved" && (
                <button onClick={() => markResolved(viewing._id)} className="btn-primary">
                  Mark as Resolved
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit modal */}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit Inquiry">
        {editForm && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Name</label>
                <input name="name" required className="input-field" value={editForm.name} onChange={handleEditChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Email</label>
                <input type="email" name="email" required className="input-field" value={editForm.email} onChange={handleEditChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Phone</label>
                <input name="phone" className="input-field" value={editForm.phone} onChange={handleEditChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Status</label>
                <select name="status" className="input-field" value={editForm.status} onChange={handleEditChange}>
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Subject</label>
              <input name="subject" className="input-field" value={editForm.subject} onChange={handleEditChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Message</label>
              <textarea name="message" rows={4} required className="input-field" value={editForm.message} onChange={handleEditChange} />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  );
}
