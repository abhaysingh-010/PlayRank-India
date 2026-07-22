"use client";

import { useState } from "react";
import { ArrowUpRight, Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const CONFIRMATION_TEXT = "PROMOTE_BGMI_BATCH";

type Result = {
  matches?: number;
  team_results?: number;
  player_stats?: number;
  already_promoted?: boolean;
};

export default function BgmiBatchPromotionPanel({
  batchId,
  status,
  totalRows,
  unresolvedRows,
  invalidRows,
}: {
  batchId: string;
  status: string;
  totalRows: number;
  unresolvedRows: number;
  invalidRows: number;
}) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const alreadyPromoted = status === "imported";
  const ready =
    status === "validated" && unresolvedRows === 0 && invalidRows === 0;

  async function promote() {
    setWorking(true);
    setError(null);

    const response = await fetch(
      "/api/admin/bgmi/import-batches/" + batchId + "/promote",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationText: confirmation }),
      },
    );
    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
      result?: Result;
    };

    if (!response.ok || !payload.ok) {
      setError(payload.error || "Unable to promote this batch");
      setWorking(false);
      return;
    }

    setResult(payload.result || {});
    setWorking(false);
    router.refresh();
  }

  if (alreadyPromoted || result) {
    return (
      <div className="border border-emerald-400/25 bg-emerald-400/[0.06] p-6">
        <div className="flex items-center gap-3 text-emerald-300">
          <Check size={20} />
          <p className="font-black">Batch published to PlayRank core.</p>
        </div>
        {result && (
          <p className="mt-3 text-sm text-white/45">
            {result.matches ?? 0} matches · {result.team_results ?? 0} team
            results · {result.player_stats ?? 0} player statistics
          </p>
        )}
      </div>
    );
  }

  return (
    <article className="overflow-hidden border border-white/10 bg-[#080a0f]">
      <div className="grid gap-8 p-6 md:grid-cols-[1fr_0.9fr] md:p-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd21a]">
            Final publication
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
            Promote validated results.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/40">
            This creates tournament matches and statistics, then refreshes
            PlayRank summaries and rankings. The operation is transactional and
            safe to retry.
          </p>
          <div className="mt-6 flex gap-6 text-xs uppercase tracking-[0.14em] text-white/35">
            <span>{totalRows} rows</span>
            <span>{unresolvedRows} unresolved</span>
            <span>{invalidRows} invalid</span>
          </div>
        </div>

        <div className="border border-white/10 bg-black/40 p-5">
          <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
            Type {CONFIRMATION_TEXT}
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={!ready || working}
              className="mt-3 w-full border border-white/15 bg-black px-4 py-3 font-mono text-sm text-white outline-none focus:border-[#ffd21a]"
            />
          </label>
          <button
            type="button"
            onClick={promote}
            disabled={!ready || working || confirmation !== CONFIRMATION_TEXT}
            className="mt-4 flex w-full items-center justify-center gap-2 bg-[#f4473b] px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-black disabled:cursor-not-allowed disabled:opacity-35"
          >
            {working ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <ArrowUpRight size={17} />
            )}
            Publish to PlayRank
          </button>
          {!ready && (
            <p className="mt-3 text-xs text-amber-200/65">
              This batch must be fully validated before it can be published.
            </p>
          )}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
        </div>
      </div>
    </article>
  );
}
