"use client";

type RankingHistoryPoint = {
  id?: string;
  rank: number | null;
  score?: number | null;
  snapshot_date: string | null;
  created_at?: string | null;
};

type Props = {
  history: RankingHistoryPoint[];
};

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RankHistoryChart({ history }: Props) {
  if (!history || history.length === 0) {
    return <div className="text-zinc-500">No ranking history</div>;
  }

  const validHistory = history.filter((item) => n(item.rank) > 0);
  const maxRank = Math.max(...validHistory.map((item) => n(item.rank)), 1);

  if (validHistory.length === 0) {
    return <div className="text-zinc-500">No ranking history</div>;
  }

  return (
    <div className="space-y-4">
      {validHistory.map((item, index) => {
        const rank = n(item.rank);
        const width = Math.max(8, 100 - (rank / maxRank) * 100 + 10);
        const date = item.snapshot_date || item.created_at || null;

        return (
          <div key={item.id || `${date}-${rank}-${index}`}>
            <div className="mb-2 flex justify-between text-sm">
              <span>{formatDate(date)}</span>
              <span>Rank #{rank}</span>
            </div>

            <div className="h-3 w-full rounded-full bg-zinc-800">
              <div
                className="h-3 rounded-full bg-emerald-500"
                style={{
                  width: `${width}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
