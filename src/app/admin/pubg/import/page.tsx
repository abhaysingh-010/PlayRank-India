import Link from "next/link";
import PubgImportMatchForm from "@/components/admin/PubgImportMatchForm";

export const dynamic = "force-dynamic";

export default function PubgImportPage() {
  return (
    <main className="min-h-screen bg-black px-7 py-24 text-white md:px-14">
      <section className="krafton-grid relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07080c] p-8 md:p-12">
        <div className="blueprint-lines" />

        <div className="relative z-10">
          <p className="krafton-label">Admin Console</p>

          <h1 className="krafton-display mt-6 text-[14vw] md:text-[8vw] xl:text-[7rem]">
            PUBG
            <br />
            IMPORT
          </h1>

          <p className="mt-6 max-w-3xl text-base font-black uppercase leading-6 tracking-[-0.03em] text-white/80 md:text-xl">
            Import a PUBG Developer API match into raw import storage and PUBG
            staging tables. Core promotion remains blocked until mapping and
            roster gates pass.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/admin/pubg/imports" className="btn-primary px-6 py-3 text-sm">
              Import Review
            </Link>

            <Link href="/admin/pubg" className="btn-secondary px-6 py-3 text-sm">
              PUBG Admin Hub
            </Link>

            <Link href="/admin/pubg/mappings" className="btn-secondary px-6 py-3 text-sm">
              Player Mappings
            </Link>

            <Link href="/admin" className="btn-secondary px-6 py-3 text-sm">
              Admin Home
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="krafton-card p-7">
          <p className="krafton-label">Import Match</p>

          <h2 className="mt-4 text-4xl font-black uppercase tracking-[-0.05em] text-white">
            Add PUBG API Match
          </h2>

          <p className="mt-4 leading-7 text-white/50">
            Paste a PUBG match ID and select the shard. The import route stores
            raw payloads, normalizes staging tables and updates promotion
            readiness.
          </p>

          <div className="mt-6 border border-yellow-400/20 bg-yellow-400/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-yellow-300">
              Safety Rule
            </p>

            <p className="mt-3 text-sm leading-6 text-white/60">
              Importing does not write to core PlayRank match tables. Promotion
              is controlled separately by mapping, roster health and promotion
              guards.
            </p>
          </div>
        </div>

        <PubgImportMatchForm />
      </section>
    </main>
  );
}