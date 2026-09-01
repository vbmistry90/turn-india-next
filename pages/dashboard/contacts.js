import { useState } from "react";
import useSWR from "swr";
import DashboardLayout from "@/components/DashboardLayout";
import PaginatedTable from "@/components/PaginatedTable";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { MdSearch, MdVisibility, MdDelete } from "react-icons/md";

const fetcher = (url) => fetch(url, { credentials: "include" }).then((r) => r.json());

export default function ContactsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);

  const query = new URLSearchParams({ page, limit: 8, search, status: statusFilter }).toString();
  const { data, isLoading, mutate } = useSWR(`/api/contacts?${query}`, fetcher);

  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0, limit: 8 };

  async function openInquiry(row) {
    setSelected(row);
    if (row.status === "new") {
      await fetch(`/api/contacts/${row._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "read" }),
      });
      mutate();
    }
  }

  async function markResolved(id) {
    await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    setSelected(null);
    mutate();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this inquiry?")) return;
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
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
      label: "",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openInquiry(row)} className="text-primary-600 hover:text-primary-800">
            <MdVisibility size={18} />
          </button>
          <button onClick={() => handleDelete(row._id)} className="text-red-500 hover:text-red-700">
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

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Inquiry Details">
        {selected && (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-ink-400 text-xs uppercase font-medium">From</p>
              <p className="text-ink-800 font-medium">{selected.name}</p>
              <p className="text-ink-500">{selected.email}</p>
              {selected.phone && <p className="text-ink-500">{selected.phone}</p>}
            </div>
            <div>
              <p className="text-ink-400 text-xs uppercase font-medium">Subject</p>
              <p className="text-ink-800">{selected.subject}</p>
            </div>
            <div>
              <p className="text-ink-400 text-xs uppercase font-medium">Message</p>
              <p className="text-ink-700 whitespace-pre-wrap">{selected.message}</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <StatusBadge value={selected.status} />
              {selected.status !== "resolved" && (
                <button onClick={() => markResolved(selected._id)} className="btn-primary">
                  Mark as Resolved
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
