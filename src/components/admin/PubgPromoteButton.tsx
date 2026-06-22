"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PromoteResult = {
  ok?: boolean;
  error?: string;
  reason?: string;
  result?: unknown;
};

export default function PubgPromoteButton({
  externalMatchId,
  promotionAllowed,
}: {
  externalMatchId: string;
  promotionAllowed: boolean;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function promoteMatch() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/pubg/promote-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          external_match_id: externalMatchId,
        }),
      });

      const data = (await response.json()) as PromoteResult;

      if (!response.ok || data.ok === false) {
        setMessage(data.reason || data.error || "Promotion failed.");
        return;
      }

      setMessage("Promotion completed successfully.");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Promotion request failed.";

      setMessage(message);
    } finally {
      setLoading(false);
    }
  }

  if (!promotionAllowed) {
    return (
      <button
        type="button"
        disabled
        className="cursor-not-allowed rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-yellow-300/70"
      >
        Promotion Blocked
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={promoteMatch}
        disabled={loading}
        className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-emerald-300 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Promoting..." : "Promote To Core"}
      </button>

      {message ? (
        <p className="max-w-xs text-xs font-black uppercase tracking-[0.12em] text-white/50">
          {message}
        </p>
      ) : null}
    </div>
  );
}