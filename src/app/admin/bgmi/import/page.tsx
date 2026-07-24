import BgmiBatchImportForm from "@/components/admin/BgmiBatchImportForm";

export const dynamic = "force-dynamic";

const requiredColumns = [
  "match_id",
  "team_name",
  "player_ign (player rows only)",
  "placement",
  "kills",
  "damage",
];

export default function BgmiImportPage() {
  return (
    <main className="min-h-screen bg-[#030406] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-[1500px] px-5 py-12 md:px-8 md:py-16">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f4473b]">
            BGMI data operations
          </p>
          <h1 className="mt-4 text-5xl font-black uppercase leading-[0.88] tracking-[-0.06em] md:text-7xl">
            Import tournament
            <br />
            results.
          </h1>
          <p className="mt-6 max-w-3xl leading-7 text-white/45">
            Upload organizer exports, automatically match known teams and
            players, and isolate uncertain records before they reach PlayRank
            rankings.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-6 px-5 py-10 md:px-8 lg:grid-cols-[1.05fr_.95fr]">
        <div className="border border-white/10 bg-[#080a0f] p-5 md:p-7">
          <div className="mb-6 border-b border-white/10 pb-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffd21a]">
              New batch
            </p>
            <h2 className="mt-2 text-2xl font-black">Upload and validate</h2>
          </div>
          <BgmiBatchImportForm />
        </div>

        <aside className="space-y-5">
          <div className="border border-white/10 bg-white/[0.025] p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffd21a]">
              Minimum CSV columns
            </p>
            <div className="mt-5 grid gap-2">
              {requiredColumns.map((column) => (
                <code
                  key={column}
                  className="border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/65"
                >
                  {column}
                </code>
              ))}
            </div>
            <p className="mt-5 text-sm leading-6 text-white/40">
              Optional fields include match_number, match_date, stage, map_name,
              assists, knocks, revives, survival_time, placement_points,
              kill_points and total_points.
            </p>
          </div>

          <div className="border border-[#f4473b]/25 bg-[#f4473b]/[0.06] p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f4473b]">
              Publishing gate
            </p>
            <h2 className="mt-3 text-xl font-black">
              Nothing is published automatically yet.
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/50">
              Clean rows become matched. Unknown names become unresolved.
              Missing required fields become invalid. The next stage adds the
              review and promotion controls.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
