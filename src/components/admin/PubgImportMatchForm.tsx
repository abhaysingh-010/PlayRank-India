"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ImportResponse = {
  ok?: boolean;
  error?: string;
  details?: string;
  matchId?: string;
  shard?: string;
  rawExternalId?: string;
  overview?: unknown;
};

export default function PubgImportMatchForm() {
  const router = useRouter();

  const [matchId, setMatchId] = useState("");
  const [shard, setShard] = useState("steam");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [json, setJson] = useState<ImportResponse | null>(null);

  async function importMatch() {
    setMessage("");
    setJson(null);

    if (!matchId.trim()) {
      setMessage("Match ID is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/pubg/import-match?shard=${encodeURIComponent(
          shard,
        )}&matchId=${encodeURIComponent(matchId.trim())}`,
      );

      const data = (await response.json()) as ImportResponse;

      setJson(data);

      if (!response.ok || data.ok === false) {
        setMessage(data.error || data.details || "Import failed.");
        return;
      }

      setMessage("Match imported successfully.");
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Import request failed.";

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-white/10 bg-[#050609] p-5 md:p-6">
      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
            External match ID *
          </span>
          <input
            value={matchId}
            onChange={(event) => setMatchId(event.target.value)}
            placeholder="PUBG Match ID"
            className="w-full border border-white/10 bg-black px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#ffd21a]/60"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
            PUBG shard
          </span>
          <select
            value={shard}
            onChange={(event) => setShard(event.target.value)}
            className="w-full border border-white/10 bg-black px-4 py-3.5 text-sm text-white outline-none focus:border-[#ffd21a]/60"
          >
            <option value="steam">steam</option>
            <option value="kakao">kakao</option>
            <option value="xbox">xbox</option>
            <option value="psn">psn</option>
          </select>
        </label>

        <button
          type="button"
          onClick={importMatch}
          disabled={loading}
          className="w-full bg-[#f4473b] px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-[#ff5a4f] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {loading ? "Importing..." : "Import PUBG Match"}
        </button>

        {message ? (
          <div
            role="status"
            className="border border-white/10 bg-white/[0.03] p-4 text-sm font-black uppercase tracking-[0.12em] text-white/70"
          >
            {message}
          </div>
        ) : null}

        {json ? (
          <pre className="max-h-[420px] overflow-auto border border-white/10 bg-black p-4 text-xs leading-6 text-white/55">
            {JSON.stringify(json, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
