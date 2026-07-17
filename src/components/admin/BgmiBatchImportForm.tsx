"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileUp, LoaderCircle } from "lucide-react";

type Result = {
  ok: boolean;
  batch_id?: string;
  status?: string;
  total_rows?: number;
  matched_rows?: number;
  unresolved_rows?: number;
  invalid_rows?: number;
  error?: string;
};

export default function BgmiBatchImportForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/bgmi/import-results", {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      setResult((await response.json()) as Result);
    } catch {
      setResult({ ok: false, error: "Upload failed. Check the server connection and retry." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block">
        <span className="text-xs font-black uppercase tracking-[0.18em] text-white/45">Tournament</span>
        <input name="tournamentName" required placeholder="BGIS 2026" className="mt-2 w-full border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition focus:border-[#f4473b]" />
      </label>

      <label className="block">
        <span className="text-xs font-black uppercase tracking-[0.18em] text-white/45">Official source URL</span>
        <input name="sourceUrl" type="url" placeholder="https://..." className="mt-2 w-full border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition focus:border-[#f4473b]" />
      </label>

      <label className="group flex min-h-44 cursor-pointer flex-col items-center justify-center border border-dashed border-white/20 bg-white/[0.025] px-6 text-center transition hover:border-[#f4473b]/70 hover:bg-[#f4473b]/[0.04]">
        <FileUp className="mb-4 text-[#f4473b]" size={28} />
        <span className="font-black text-white">Choose organizer CSV or JSON</span>
        <span className="mt-2 text-xs text-white/35">Up to 5 MB and 10,000 rows</span>
        <input name="file" type="file" accept=".csv,.json,text/csv,application/json" required className="mt-5 block max-w-full text-xs text-white/45 file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white" />
      </label>

      <button disabled={loading} className="flex w-full items-center justify-center gap-2 bg-[#f4473b] px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-[#ff5a4e] disabled:opacity-50">
        {loading ? <LoaderCircle className="animate-spin" size={17} /> : <FileUp size={17} />}
        {loading ? "Validating batch" : "Upload and validate"}
      </button>

      {result && (
        <div className={`border p-5 ${result.ok ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-red-400/25 bg-red-400/[0.06]"}`}>
          <div className="flex items-center gap-2">
            {result.ok ? <CheckCircle2 className="text-emerald-300" size={18} /> : <AlertTriangle className="text-red-300" size={18} />}
            <p className="font-black text-white">{result.ok ? "Batch staged successfully" : "Import failed"}</p>
          </div>
          {result.ok ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[["Rows", result.total_rows ?? 0], ["Matched", result.matched_rows ?? 0], ["Unresolved", result.unresolved_rows ?? 0], ["Invalid", result.invalid_rows ?? 0]].map(([label, count]) => (
                  <div key={String(label)} className="border border-white/10 bg-black/20 p-3">
                    <span className="block text-[10px] uppercase tracking-widest text-white/35">{label}</span>
                    <strong className="mt-2 block text-2xl font-black text-white">{String(count)}</strong>
                  </div>
                ))}
              </div>
              {result.batch_id && (
                <Link href={"/admin/bgmi/imports/" + result.batch_id} className="mt-4 inline-flex bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-black">
                  Review unresolved records
                </Link>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-red-100/70">{result.error}</p>
          )}
        </div>
      )}
    </form>
  );
}

