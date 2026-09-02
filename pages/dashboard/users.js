import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import PaginatedTable from "@/components/PaginatedTable";
import StatusBadge from "@/components/StatusBadge";
import useAuth from "@/hooks/useAuth";
import { MdSearch } from "react-icons/md";
import { timedFetcher, timedFetch } from "@/lib/apiClient";

const fetcher = timedFetcher;

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth({ redirectOnFail: true });

  // Admin-only page — API already enforces this, but bounce non-admins
  // out of the UI too rather than showing them a page full of errors.
  useEffect(() => {
    if (!authLoading && currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [authLoading, currentUser, router]);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [error, setError] = useState("");

  const query = new URLSearchParams({ page, limit: 10, search, role: roleFilter }).toString();
  const { data, isLoading, mutate } = useSWR(`/api/users?${query}`, fetcher);

  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0, limit: 10 };

  async function updateUser(id, updates) {
    setError("");
    const res = await timedFetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const result = await res.json();
    if (!result.success) {
      setError(result.message || "Failed to update user");
      return;
    }
    mutate();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this user account? This cannot be undone.")) return;
    const res = await timedFetch(`/api/users/${id}`, { method: "DELETE" });
    const result = await res.json();
    if (!result.success) {
      setError(result.message || "Failed to delete user");
      return;
    }
    mutate();
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (row) => (
        <select
          className="input-field py-1 text-sm w-32"
          value={row.role}
          disabled={row._id === currentUser?.id}
          onChange={(e) => updateUser(row._id, { role: e.target.value })}
        >
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (row) => (
        <button
          disabled={row._id === currentUser?.id}
          onClick={() => updateUser(row._id, { isActive: !row.isActive })}
          className="disabled:cursor-not-allowed disabled:opacity-60"
        >
          <StatusBadge value={row.isActive ? "active" : "inactive"} />
        </button>
      ),
    },
    {
      key: "twoFactorEnabled",
      label: "2FA",
      render: (row) => (row.twoFactorEnabled ? <StatusBadge value="active" /> : <span className="text-ink-400 text-xs">Off</span>),
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "",
      render: (row) =>
        row._id !== currentUser?.id ? (
          <button onClick={() => handleDelete(row._id)} className="text-red-500 hover:text-red-700 text-sm">
            Remove
          </button>
        ) : (
          <span className="text-ink-300 text-xs">You</span>
        ),
    },
  ];

  return (
    <DashboardLayout title="Manage Users">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-72">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
            <input
              className="input-field pl-9"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="input-field sm:w-44"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>
        )}

        <PaginatedTable
          columns={columns}
          rows={rows}
          pagination={pagination}
          onPageChange={setPage}
          isLoading={isLoading}
          emptyMessage="No users found."
        />

        <p className="text-xs text-ink-400">
          Assigning the <strong>Admin</strong> role grants full access, including user management and appearance settings.
          You can't change your own role or disable your own account.
        </p>
      </div>
    </DashboardLayout>
  );
}
