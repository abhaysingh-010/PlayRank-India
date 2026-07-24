type DataSourceBadgeProps = {
  source?: string | null;
  verified?: boolean | null;
  label?: string;
  size?: "sm" | "md";
};

function normalizeSource(source?: string | null) {
  const value = (source || "").toLowerCase();

  if (value.includes("krafton")) return "Official";
  if (value.includes("pubg")) return "PUBG API";
  if (value.includes("api")) return "API";
  if (value.includes("manual")) return "Manual";
  if (value.includes("import")) return "Imported";

  return source || "PlayRank";
}

export default function DataSourceBadge({
  source,
  verified,
  label,
  size = "sm",
}: DataSourceBadgeProps) {
  const displayLabel = label || normalizeSource(source);

  const lowerLabel = displayLabel.toLowerCase();

  const isOfficial = lowerLabel.includes("official");
  const isApi = lowerLabel.includes("api");
  const isAnalytics = lowerLabel.includes("analytics");
  const isVerified = Boolean(verified);

  const tone = isOfficial
    ? "border-[#ff4038]/35 bg-[#ff4038]/10 text-[#ff4038]"
    : isVerified
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : isApi
        ? "border-blue-400/30 bg-blue-400/10 text-blue-300"
        : isAnalytics
          ? "border-[#ffd21a]/30 bg-[#ffd21a]/10 text-[#ffd21a]"
          : "border-white/15 bg-white/[0.04] text-white/55";

  const sizeClass =
    size === "md" ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-black uppercase tracking-[0.14em] ${tone} ${sizeClass}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {displayLabel}
      {isVerified && !isOfficial && !lowerLabel.includes("verified")
        ? " Verified"
        : ""}
    </span>
  );
}
