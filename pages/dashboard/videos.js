import { useState } from "react";
import useSWR from "swr";
import DashboardLayout from "@/components/DashboardLayout";
import PaginatedTable from "@/components/PaginatedTable";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { MdAdd, MdDelete, MdSearch, MdOutlineCloudUpload, MdEdit, MdVisibility } from "react-icons/md";
import { timedFetcher, timedFetch } from "@/lib/apiClient";

const fetcher = timedFetcher;

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// const CLOUD_NAME = 'to5mtmpw';
// const UPLOAD_PRESET = 'TurnIndia';

const emptyForm = {
  name: "",
  category: "",
  description: "",
  author: "",
  status: "draft",
  priority: "medium",
};

export default function VideosPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = create mode
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const query = new URLSearchParams({ page, limit: 8, search }).toString();
  const { data, isLoading, mutate } = useSWR(`/api/videos?${query}`, fetcher);

  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0, limit: 8 };

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setFile(null);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(row) {
    setEditingId(row._id);
    setForm({
      name: row.name,
      category: row.category,
      description: row.description || "",
      author: row.author,
      status: row.status,
      priority: row.priority,
    });
    setFile(null);
    setError("");
    setModalOpen(true);
  }

  function uploadToCloudinary(fileToUpload) {
    return new Promise((resolve, reject) => {
      if (!CLOUD_NAME || !UPLOAD_PRESET) {
        reject(new Error("Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local"));
        return;
      }

      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", "eco-admin/videos");

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error("Cloudinary upload failed"));
        }
      };
      xhr.onerror = () => reject(new Error("Cloudinary upload failed"));
      xhr.send(formData);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!editingId && !file) {
      setError("Please select a video file to upload");
      return;
    }
    if (!form.name || !form.category || !form.author) {
      setError("Name, category and author are required");
      return;
    }

    setUploading(true);
    try {
      let payload = { ...form };

      if (file) {
        const cloudinaryResult = await uploadToCloudinary(file);
        payload.url = cloudinaryResult.secure_url;
        payload.publicId = cloudinaryResult.public_id;
      }

      const url = editingId ? `/api/videos/${editingId}` : "/api/videos";
      const method = editingId ? "PATCH" : "POST";

      const res = await timedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(result.message || "Failed to save video");
        setUploading(false);
        return;
      }

      setModalOpen(false);
      setForm(emptyForm);
      setFile(null);
      setUploadProgress(0);
      setUploading(false);
      setEditingId(null);
      mutate();
    } catch (err) {
      setError(err.message || "Upload failed");
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this video? This cannot be undone.")) return;
    await timedFetch(`/api/videos/${id}`, { method: "DELETE" });
    mutate();
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    { key: "author", label: "Author" },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge value={row.status} />,
    },
    {
      key: "priority",
      label: "Priority",
      render: (row) => <StatusBadge value={row.priority} />,
    },
    {
      key: "createdAt",
      label: "Uploaded",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
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
    <DashboardLayout title="Project Videos">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
            <input
              className="input-field pl-9"
              placeholder="Search by name, author, category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <button onClick={openCreateModal} className="btn-primary">
            <MdAdd size={18} /> Upload Video
          </button>
        </div>

        <PaginatedTable
          columns={columns}
          rows={rows}
          pagination={pagination}
          onPageChange={setPage}
          isLoading={isLoading}
          emptyMessage="No project videos yet. Click 'Upload Video' to add one."
        />
      </div>

      {/* Create / Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Video" : "Upload Project Video"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">
              Video file {editingId && <span className="text-ink-400 font-normal">(leave empty to keep current video)</span>}
            </label>
            <label className="flex items-center gap-2 border-2 border-dashed border-ink-200 rounded-lg px-3 py-4 cursor-pointer hover:border-primary-400 text-sm text-ink-500">
              <MdOutlineCloudUpload size={20} />
              {file ? file.name : editingId ? "Click to replace video file" : "Click to select a video file"}
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </label>
            {uploading && (
              <div className="w-full bg-ink-100 rounded-full h-2 mt-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Name</label>
              <input name="name" required className="input-field" value={form.name} onChange={handleFormChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Category</label>
              <input name="category" required className="input-field" value={form.category} onChange={handleFormChange} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Author</label>
            <input name="author" required className="input-field" value={form.author} onChange={handleFormChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Description</label>
            <textarea name="description" rows={3} className="input-field" value={form.description} onChange={handleFormChange} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Status</label>
              <select name="status" className="input-field" value={form.status} onChange={handleFormChange}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Priority</label>
              <select name="priority" className="input-field" value={form.priority} onChange={handleFormChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={uploading} className="btn-primary w-full">
            {uploading ? `Saving... ${uploadProgress > 0 ? uploadProgress + "%" : ""}` : editingId ? "Save Changes" : "Upload & Save"}
          </button>
        </form>
      </Modal>

      {/* View modal */}
      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title="Video Details">
        {viewing && (
          <div className="space-y-3 text-sm">
            <video controls className="w-full rounded-lg bg-black max-h-64" src={viewing.url} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-ink-400 text-xs uppercase font-medium">Name</p>
                <p className="text-ink-800">{viewing.name}</p>
              </div>
              <div>
                <p className="text-ink-400 text-xs uppercase font-medium">Category</p>
                <p className="text-ink-800">{viewing.category}</p>
              </div>
              <div>
                <p className="text-ink-400 text-xs uppercase font-medium">Author</p>
                <p className="text-ink-800">{viewing.author}</p>
              </div>
              <div>
                <p className="text-ink-400 text-xs uppercase font-medium">Uploaded</p>
                <p className="text-ink-800">{new Date(viewing.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-ink-400 text-xs uppercase font-medium">Status</p>
                <StatusBadge value={viewing.status} />
              </div>
              <div>
                <p className="text-ink-400 text-xs uppercase font-medium">Priority</p>
                <StatusBadge value={viewing.priority} />
              </div>
            </div>
            {viewing.description && (
              <div>
                <p className="text-ink-400 text-xs uppercase font-medium">Description</p>
                <p className="text-ink-700 whitespace-pre-wrap">{viewing.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
