"use client";

type Props = {
  history: any[];
};

export default function RankHistoryChart({ history }: Props) {
  if (!history || history.length === 0) {
    return (
      <div className="text-zinc-500">
        No ranking history
      </div>
    );
  }

  const maxRank = Math.max(...history.map(h => h.rank));

  return (
    <div className="space-y-4">
      {history.map((item, index) => {
        const width = (item.rank / maxRank) * 100;

        return (
          <div key={index}>
            <div className="flex justify-between text-sm mb-2">
              <span>
                {new Date(item.snapshot_date).toLocaleDateString()}
              </span>
              <span>Rank #{item.rank}</span>
            </div>

            <div className="w-full bg-zinc-800 rounded-full h-3">
              <div
                className="bg-emerald-500 h-3 rounded-full"
                style={{
                  width: `${100 - width + 10}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}