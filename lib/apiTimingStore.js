/**
 * Tiny external store (no extra dependency) that tracks the timing of the
 * most recent API calls made from the browser. Components subscribe via
 * hooks/useApiTiming.js to render a live "last request took Xms" indicator.
 */
let current = { url: null, method: "GET", ms: null, ok: true, status: null, ts: null };
let history = []; // most recent first, capped

const MAX_HISTORY = 20;
const listeners = new Set();

export function recordApiTiming(entry) {
  current = { ...entry, ts: Date.now() };
  history = [current, ...history].slice(0, MAX_HISTORY);
  listeners.forEach((listener) => listener(current, history));
}

export function subscribeApiTiming(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getApiTiming() {
  return { current, history };
}
