import { useState } from "react";
import useSWR from "swr";
import DashboardLayout from "@/components/DashboardLayout";
import PaginatedTable from "@/components/PaginatedTable";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { MdAdd, MdDelete, MdSearch, MdOutlineCloudUpload } from "react-icons/md";

const fetcher = (url) => fetch(url, { credentials: "include" }).then((r) => r.json());

// const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
// const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const CLOUD_NAME = 'to5mtmpw';
const UPLOAD_PRESET = 'TurnIndia';

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

    if (!file) {
      setError("Please select a video file to upload");
      return;
    }
    if (!form.name || !form.category || !form.author) {
      setError("Name, category and author are required");
      return;
    }

    setUploading(true);
    try {
      const cloudinaryResult = await uploadToCloudinary(file);

      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          url: cloudinaryResult.secure_url,
          publicId: cloudinaryResult.public_id,
        }),
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
      mutate();
    } catch (err) {
      setError(err.message || "Upload failed");
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this video? This cannot be undone.")) return;
    await fetch(`/api/videos/${id}`, { method: "DELETE" });
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
      key: "url",
      label: "Preview",
      render: (row) => (
        <a href={row.url} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
          View
        </a>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button onClick={() => handleDelete(row._id)} className="text-red-500 hover:text-red-700">
          <MdDelete size={18} />
        </button>
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
          <button onClick={() => setModalOpen(true)} className="btn-primary">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Upload Project Video">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Video file</label>
            <label className="flex items-center gap-2 border-2 border-dashed border-ink-200 rounded-lg px-3 py-4 cursor-pointer hover:border-primary-400 text-sm text-ink-500">
              <MdOutlineCloudUpload size={20} />
              {file ? file.name : "Click to select a video file"}
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
            {uploading ? `Uploading... ${uploadProgress}%` : "Upload & Save"}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
