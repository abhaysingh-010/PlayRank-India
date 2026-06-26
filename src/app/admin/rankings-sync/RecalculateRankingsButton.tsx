"use client";

import { useState } from "react";

type ApiResult = {
  ok?: boolean;
  job_id?: string;
  recalculated?: boolean;
  action?: string;
  error?: string;
  details?: string;
};

export default function RecalculateRankingsButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);

  async function runRecalculation() {
    const confirmed = window.confirm(
      "Run ranking recalculation now? This will trigger calculate_player_scores and create an internal job record."
    );

    if (!confirmed) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/recalculate-rankings", {
        method: "POST",
      });

      const payload = (await response.json()) as ApiResult;
      setResult(payload);
    } catch (error) {
      setResult({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown ranking recalculation error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[2rem] border border-yellow-400/20 bg-yellow-400/[0.06] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-300">
            Protected Mutation
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Recalculate Player Scores
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
            This action calls the protected admin API route and runs the
            calculate_player_scores database function. Use it only after data
            imports, player stats updates, or ranking maintenance.
          </p>
        </div>

        <button
          type="button"
          onClick={runRecalculation}
          disabled={loading}
          className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 text-sm font-black text-yellow-300 transition hover:bg-yellow-400/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Running..." : "Run Recalculation"}
        </button>
      </div>

      {result && (
        <div
          className={`mt-5 rounded-2xl border p-4 ${
            result.ok
              ? "border-emerald-400/20 bg-emerald-400/[0.06]"
              : "border-red-400/20 bg-red-400/[0.06]"
          }`}
        >
          <p
            className={`text-sm font-black ${
              result.ok ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {result.ok ? "Ranking recalculation completed" : "Ranking recalculation failed"}
          </p>

          <div className="mt-3 grid gap-2 text-sm text-white/55">
            {result.job_id && <p>Job ID: {result.job_id}</p>}
            {result.action && <p>Action: {result.action}</p>}
            {result.error && <p>Error: {result.error}</p>}
            {result.details && <p>Details: {result.details}</p>}
          </div>
        </div>
      )}
    </div>
  );
}