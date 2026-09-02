import { useState } from "react";
import useSWR from "swr";
import DashboardLayout from "@/components/DashboardLayout";
import { MdAdd, MdDelete, MdOutlineCloudUpload, MdSearch } from "react-icons/md";
import MediaGridSkeleton from "@/components/skeletons/MediaGridSkeleton";
import { timedFetcher, timedFetch } from "@/lib/apiClient";

const fetcher = timedFetcher;

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// const CLOUD_NAME = 'to5mtmpw';
// const UPLOAD_PRESET = 'TurnIndia';

export default function MediaPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const query = new URLSearchParams({ page, limit: 20, search, type: typeFilter }).toString();
  const { data, isLoading, mutate } = useSWR(`/api/media?${query}`, fetcher);

  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0, limit: 20 };

  function uploadToCloudinary(fileToUpload, resourceType) {
    return new Promise((resolve, reject) => {
      if (!CLOUD_NAME || !UPLOAD_PRESET) {
        reject(new Error("Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"));
        return;
      }
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", "eco-admin/media");

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
        else reject(new Error("Upload failed"));
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(formData);
    });
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setError("");
    setUploading(true);

    try {
      const isVideo = file.type.startsWith("video/");
      const resourceType = isVideo ? "video" : "image";
      const result = await uploadToCloudinary(file, resourceType);

      const res = await timedFetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          url: result.secure_url,
          publicId: result.public_id,
          type: isVideo ? "video" : "image",
        }),
      });
      const saveResult = await res.json();
      if (!saveResult.success) {
        setError(saveResult.message || "Failed to save media record");
      } else {
        setFile(null);
        mutate();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this media item?")) return;
    await timedFetch(`/api/media/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <DashboardLayout title="Media Library">
      <div className="space-y-4">
        {/* Upload bar */}
        <form onSubmit={handleUpload} className="card flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <label className="flex-1 flex items-center gap-2 border-2 border-dashed border-ink-200 rounded-lg px-3 py-3 cursor-pointer hover:border-primary-400 text-sm text-ink-500">
            <MdOutlineCloudUpload size={20} />
            {file ? file.name : "Choose an image or video to upload"}
            <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
          </label>
          <button type="submit" disabled={!file || uploading} className="btn-primary whitespace-nowrap">
            <MdAdd size={18} /> {uploading ? `Uploading ${progress}%` : "Upload"}
          </button>
        </form>
        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-72">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
            <input
              className="input-field pl-9"
              placeholder="Search media by name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="input-field sm:w-44"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <MediaGridSkeleton count={10} />
        ) : rows.length === 0 ? (
          <div className="card text-center text-ink-400 py-12">No media uploaded yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {rows.map((item) => (
              <div key={item._id} className="card p-0 overflow-hidden group relative">
                <div className="aspect-square bg-ink-100">
                  {item.type === "video" ? (
                    <video src={item.url} className="w-full h-full object-cover" muted />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs text-ink-600 truncate">{item.name}</p>
                </div>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MdDelete size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 text-sm">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn-secondary disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-ink-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
