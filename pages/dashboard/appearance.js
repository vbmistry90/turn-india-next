import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import useAuth from "@/hooks/useAuth";
import { MdPalette } from "react-icons/md";
import FormCardSkeleton from "@/components/skeletons/FormCardSkeleton";
import { timedFetcher, timedFetch } from "@/lib/apiClient";

const fetcher = timedFetcher;

const COLOR_PRESETS = ["#16a34a", "#2563eb", "#7c3aed", "#dc2626", "#ea580c", "#0891b2", "#db2777"];
const FONT_OPTIONS = ["Inter", "DM Sans", "Poppins", "Roboto", "Playfair Display", "System UI"];
const TEXT_SIZE_OPTIONS = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium (default)" },
  { value: "lg", label: "Large" },
];
const RADIUS_OPTIONS = [
  { value: "none", label: "Square" },
  { value: "sm", label: "Slightly rounded" },
  { value: "md", label: "Rounded (default)" },
  { value: "lg", label: "Very rounded" },
  { value: "full", label: "Pill" },
];

export default function AppearancePage() {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth({ redirectOnFail: true });

  useEffect(() => {
    if (!authLoading && currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [authLoading, currentUser, router]);

  const { data, mutate } = useSWR("/api/settings/theme", fetcher);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (data?.data && !form) {
      setForm(data.data);
    }
  }, [data, form]);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    const res = await timedFetch("/api/settings/theme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    setSaving(false);
    if (result.success) {
      setMessage("Appearance settings saved. Changes apply across the dashboard immediately.");
      mutate();
    } else {
      setMessage(result.message || "Failed to save settings");
    }
  }

  if (!form) {
    return (
      <DashboardLayout title="Appearance">
        <div className="max-w-2xl">
          <FormCardSkeleton fields={4} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Appearance">
      <div className="max-w-2xl space-y-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <MdPalette size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-ink-800">Dashboard Appearance</h2>
              <p className="text-sm text-ink-500">Customize the look and feel for all admin users</p>
            </div>
          </div>

          {message && (
            <div className="mb-4 rounded-lg bg-primary-50 border border-primary-200 text-primary-700 text-sm px-3 py-2">
              {message}
            </div>
          )}

          <div className="space-y-6">
            {/* Theme color */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">Theme Color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setForm((f) => ({ ...f, themeColor: color }))}
                    className={`w-9 h-9 rounded-full border-2 ${form.themeColor === color ? "border-ink-800" : "border-transparent"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={form.themeColor}
                  onChange={(e) => setForm((f) => ({ ...f, themeColor: e.target.value }))}
                  className="w-9 h-9 rounded-full border border-ink-200 cursor-pointer"
                />
              </div>
            </div>

            {/* Font family */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">Font Family</label>
              <select
                className="input-field"
                value={form.fontFamily}
                onChange={(e) => setForm((f) => ({ ...f, fontFamily: e.target.value }))}
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>

            {/* Text size */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">Base Text Size</label>
              <div className="flex gap-2">
                {TEXT_SIZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setForm((f) => ({ ...f, baseTextSize: opt.value }))}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                      form.baseTextSize === opt.value
                        ? "border-primary-600 bg-primary-50 text-primary-700 font-medium"
                        : "border-ink-200 text-ink-600 hover:bg-ink-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Border radius */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">Corner Style</label>
              <select
                className="input-field"
                value={form.borderRadius}
                onChange={(e) => setForm((f) => ({ ...f, borderRadius: e.target.value }))}
              >
                {RADIUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary mt-6">
            {saving ? "Saving..." : "Save Appearance Settings"}
          </button>
        </div>

        {/* Live preview */}
        <div className="card">
          <h3 className="font-semibold text-ink-800 mb-3 text-sm">Preview</h3>
          <div
            className="p-4 border border-ink-200"
            style={{
              fontFamily: `${form.fontFamily}, sans-serif`,
              borderRadius: { none: "0px", sm: "6px", md: "10px", lg: "16px", full: "24px" }[form.borderRadius],
              fontSize: { sm: "14px", md: "15px", lg: "16.5px" }[form.baseTextSize],
            }}
          >
            <button
              className="px-4 py-2 text-white font-medium"
              style={{
                backgroundColor: form.themeColor,
                borderRadius: { none: "0px", sm: "6px", md: "10px", lg: "16px", full: "9999px" }[form.borderRadius],
              }}
            >
              Sample Button
            </button>
            <p className="mt-3 text-ink-700">This is how body text will look across the dashboard.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
