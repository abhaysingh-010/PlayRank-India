import Link from "next/link";
import DataSourceBadge from "@/components/DataSourceBadge";
import PubgImportMatchForm from "@/components/admin/PubgImportMatchForm";

export const dynamic = "force-dynamic";

const workflow = [
  {
    label: "Step 01",
    title: "Import to staging",
    description:
      "The PUBG API payload is stored in raw import tables and normalized into PUBG staging tables.",
  },
  {
    label: "Step 02",
    title: "Review mappings",
    description:
      "Imported players must be mapped to verified PlayRank player records before promotion.",
  },
  {
    label: "Step 03",
    title: "Promote only when safe",
    description:
      "Core PlayRank tables are updated only after mapping, team and roster readiness checks pass.",
  },
];

function WorkflowStep({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd21a]">
        {label}
      </p>

      <h3 className="mt-3 text-lg font-black text-white">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-white/45">{description}</p>
    </div>
  );
}

export default function PubgImportPage() {
  return (
    <main className="min-h-screen bg-[#030406] text-white">
      <section className="border-b border-white/10 bg-[#050609]">
        <div className="mx-auto max-w-7xl px-5 py-12 md:py-16">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <DataSourceBadge label="Admin Console" size="md" />
              <DataSourceBadge label="PUBG Import" size="md" />
              <DataSourceBadge label="Staging Only" size="md" />
            </div>

            <h1 className="mt-7 text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-7xl">
              Import PUBG
              <br />
              Match
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-7 text-white/50">
              Import a PUBG Developer API match into raw storage and PUBG
              staging tables. This does not write to public PlayRank core match
              tables until promotion gates pass.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/admin/pubg/imports"
                className="rounded-full border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-sm font-black text-[#ffd21a] transition hover:bg-[#ffd21a]/15"
              >
                Import Review
              </Link>

              <Link
                href="/admin/pubg"
                className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
              >
                PUBG Hub
              </Link>

              <Link
                href="/admin/pubg/mappings"
                className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
              >
                Player Mappings
              </Link>

              <Link
                href="/admin"
                className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
              >
                Admin Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-[2rem] border border-white/10 bg-[#080a0f] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-6">
          <div className="mb-5 border-b border-white/10 pb-4">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ffd21a]">
              Import Form
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
              Add PUBG API Match
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
              Paste the PUBG match ID and select the correct shard. The import
              endpoint will store raw payloads, normalize staging rows and update
              promotion readiness.
            </p>
          </div>

          <PubgImportMatchForm />
        </section>

        <section className="space-y-5">
          <div className="rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-5 md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-300">
              Safety Rule
            </p>

            <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
              Import does not mean publish.
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/60">
              This page only imports data into raw and staging layers. Public
              PlayRank tables stay protected until player mappings, team links,
              roster health and promotion checks are clean.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#080a0f] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-6">
            <div className="mb-5 border-b border-white/10 pb-4">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ffd21a]">
                Workflow
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
                Staging-to-Core Flow
              </h2>
            </div>

            <div className="grid gap-3">
              {workflow.map((item) => (
                <WorkflowStep
                  key={item.label}
                  label={item.label}
                  title={item.title}
                  description={item.description}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/admin/pubg/imports"
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-[#ffd21a]/30 hover:bg-white/[0.055]"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd21a]">
                Next
              </p>

              <p className="mt-3 font-black text-white">Review Imports</p>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Check readiness, blocked reasons and promotion eligibility.
              </p>
            </Link>

            <Link
              href="/admin/pubg/mappings"
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-[#ffd21a]/30 hover:bg-white/[0.055]"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd21a]">
                Required
              </p>

              <p className="mt-3 font-black text-white">Map Players</p>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Link imported PUBG identities to PlayRank player records.
              </p>
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}