type FreshnessStatus = "current" | "recent" | "stale" | "missing";

type DataFreshnessBadgeProps = {
  value?: string | null;
  label?: string;
  size?: "sm" | "md";
};

function getDaysOld(value?: string | null) {
  if (!value) return null;

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) return null;

  const diffMs = Date.now() - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays >= 0 ? diffDays : 0;
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) return "Not available";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatus(daysOld: number | null): FreshnessStatus {
  if (daysOld === null) return "missing";
  if (daysOld <= 7) return "current";
  if (daysOld <= 30) return "recent";
  return "stale";
}

function getStatusLabel(status: FreshnessStatus) {
  if (status === "current") return "Current";
  if (status === "recent") return "Recent";
  if (status === "stale") return "Stale";

  return "Not available";
}

function getTone(status: FreshnessStatus) {
  if (status === "current") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "recent") {
    return "border-blue-400/30 bg-blue-400/10 text-blue-300";
  }

  if (status === "stale") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  return "border-white/15 bg-white/[0.04] text-white/55";
}

export default function DataFreshnessBadge({
  value,
  label = "Data Freshness",
  size = "sm",
}: DataFreshnessBadgeProps) {
  const daysOld = getDaysOld(value);
  const status = getStatus(daysOld);
  const displayDate = formatDate(value);
  const displayStatus = getStatusLabel(status);

  const sizeClass =
    size === "md" ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[10px]";

  return (
    <span
      title={`${label}: ${displayDate}`}
      className={`inline-flex items-center gap-1.5 rounded-full border font-black uppercase tracking-[0.14em] ${getTone(
        status
      )} ${sizeClass}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}: {displayStatus}
    </span>
  );
}
