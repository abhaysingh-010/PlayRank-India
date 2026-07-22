"use client";

import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type Team = { id: string; name: string };
type AliasGroup = {
  sourceTeamName: string;
  affectedRows: number;
  candidates: Array<Team & { score: number }>;
};

export default function BgmiTeamResolutionPanel({
  batchId,
  groups,
  allTeams,
}: {
  batchId: string;
  groups: AliasGroup[];
  allTeams: Team[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, string>>(
    Object.fromEntries(
      groups.map((group) => [
        group.sourceTeamName,
        group.candidates[0]?.id || "",
      ]),
    ),
  );
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolve(sourceTeamName: string) {
    const teamId = selected[sourceTeamName];
    if (!teamId) return;
    setWorking(sourceTeamName);
    setError(null);

    const response = await fetch(
      "/api/admin/bgmi/import-batches/" + batchId + "/resolve-team",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceTeamName, teamId }),
      },
    );
    const result = (await response.json()) as { ok?: boolean; error?: string };

    if (!response.ok || !result.ok) {
      setError(result.error || "Unable to resolve team alias");
      setWorking(null);
      return;
    }

    setWorking(null);
    router.refresh();
  }

  if (!groups.length) {
    return (
      <div className="border border-emerald-400/25 bg-emerald-400/[0.06] p-6">
        <div className="flex items-center gap-3 text-emerald-300">
          <Check size={20} />
          <p className="font-black">All team aliases are resolved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
          {error}
        </p>
      )}
      {groups.map((group) => (
        <article
          key={group.sourceTeamName}
          className="grid gap-4 border border-white/10 bg-[#080a0f] p-5 md:grid-cols-[1fr_1fr_auto] md:items-center"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f4473b]">
              Liquipedia alias
            </p>
            <h3 className="mt-2 font-black text-white">
              {group.sourceTeamName}
            </h3>
            <p className="mt-1 text-xs text-white/35">
              {group.affectedRows} affected rows
            </p>
          </div>

          <label>
            <span className="sr-only">PlayRank team</span>
            <select
              value={selected[group.sourceTeamName] || ""}
              onChange={(event) =>
                setSelected((current) => ({
                  ...current,
                  [group.sourceTeamName]: event.target.value,
                }))
              }
              className="w-full border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none focus:border-[#ffd21a]"
            >
              <option value="">Select matching team</option>
              {allTeams.map((team) => {
                const suggestion = group.candidates.find(
                  (candidate) => candidate.id === team.id,
                );
                return (
                  <option key={team.id} value={team.id}>
                    {team.name}
                    {suggestion ? " — suggested " + suggestion.score + "%" : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <button
            type="button"
            disabled={
              !selected[group.sourceTeamName] ||
              working === group.sourceTeamName
            }
            onClick={() => resolve(group.sourceTeamName)}
            className="flex items-center justify-center gap-2 bg-[#ffd21a] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-black disabled:opacity-40"
          >
            {working === group.sourceTeamName ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <Check size={16} />
            )}
            Approve
          </button>
        </article>
      ))}
    </div>
  );
}
