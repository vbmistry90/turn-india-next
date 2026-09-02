/** Base building block — an animated pulsing bar/box. Compose with className for size. */
export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-ink-200/70 rounded-md ${className}`} />;
}
