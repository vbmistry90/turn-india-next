import { useState } from "react";
import useApiTiming from "@/hooks/useApiTiming";
import { MdBolt } from "react-icons/md";

function speedColor(ms, ok) {
  if (!ok) return "text-red-600 bg-red-50 border-red-200";
  if (ms < 200) return "text-green-700 bg-green-50 border-green-200";
  if (ms < 600) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function shortenUrl(url) {
  if (!url) return "";
  try {
    const path = url.startsWith("http") ? new URL(url).pathname : url.split("?")[0];
    return path.replace("/api/", "");
  } catch {
    return url;
  }
}

/** Small live indicator showing the response time of the most recent API call. */
export default function ApiTimingBadge() {
  const { current, history } = useApiTiming();
  const [open, setOpen] = useState(false);

  if (!current?.ts) return null; // nothing fetched yet this session

  return (
    <div className="relative hidden md:block">
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseLeave={() => setOpen(false)}
        title={`${current.method} ${shortenUrl(current.url)} — ${current.ms}ms`}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${speedColor(current.ms, current.ok)}`}
      >
        <MdBolt size={13} />
        {current.ms}ms
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-ink-100 py-2 z-50 text-xs">
          <p className="px-3 pb-1.5 text-ink-400 font-semibold uppercase tracking-wide">Recent API calls</p>
          <div className="max-h-64 overflow-y-auto">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 hover:bg-ink-50">
                <span className="text-ink-600 truncate mr-2">
                  <span className="font-mono text-ink-400 mr-1">{h.method}</span>
                  {shortenUrl(h.url)}
                </span>
                <span className={`shrink-0 font-medium ${h.ok ? "text-ink-700" : "text-red-600"}`}>{h.ms}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
