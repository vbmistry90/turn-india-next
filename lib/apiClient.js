import { recordApiTiming } from "@/lib/apiTimingStore";

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/**
 * Drop-in replacement for `fetch()` that measures round-trip time and
 * records it in the shared API timing store — used everywhere the app
 * talks to its own /api/* routes, for both reads and mutations.
 * Returns the raw Response, exactly like fetch(), so existing
 * `res.ok` / `res.json()` call sites don't need to change shape.
 */
export async function timedFetch(url, options = {}) {
  const start = now();
  const method = (options.method || "GET").toUpperCase();

  let res;
  try {
    res = await fetch(url, { credentials: "include", ...options });
  } catch (err) {
    recordApiTiming({ url: String(url), method, ms: Math.round(now() - start), ok: false, status: 0 });
    throw err;
  }

  recordApiTiming({ url: String(url), method, ms: Math.round(now() - start), ok: res.ok, status: res.status });
  return res;
}

/** Convenience wrapper for SWR — fetch + parse JSON in one call. */
export async function timedFetcher(url, options = {}) {
  const res = await timedFetch(url, options);
  return res.json();
}
