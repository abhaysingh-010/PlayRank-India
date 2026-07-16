import Link from "next/link";

const workflows = [
  {
    index: "01",
    label: "PUBG API import",
    detail: "Ingest an official match into raw storage and staging tables.",
    href: "/admin/pubg/import",
    action: "Import match",
  },
  {
    index: "02",
    label: "Import review",
    detail: "Inspect staged matches, mapping coverage and promotion readiness.",
    href: "/admin/pubg/imports",
    action: "Review queue",
  },
  {
    index: "03",
    label: "Promotion audit",
    detail: "Confirm which staged records reached the public match dataset.",
    href: "/admin/pubg/promotions",
    action: "Open audit",
  },
];

export default function AdminMatchesPage() {
  return (
    <main className="bg-[#030406] text-white">
      <header className="border-b border-white/10 bg-[#050609]">
        <div className="mx-auto grid max-w-[1500px] gap-8 px-5 py-10 md:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f4473b]">
              Entity management / matches
            </p>
            <h1 className="mt-4 text-5xl font-black uppercase leading-[0.86] tracking-[-0.065em] md:text-7xl">
              Match pipeline.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/45">
              Match records enter through the protected PUBG staging workflow,
              then become public only after identity and roster checks pass.
            </p>
          </div>
          <Link href="/matches" className="pr-button pr-button-primary">
            Public matches
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-5 py-10 md:px-8">
        <div className="grid border-l border-t border-white/10 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <Link
              key={workflow.index}
              href={workflow.href}
              className="group min-h-72 border-b border-r border-white/10 bg-[#080a0f] p-6 transition hover:bg-white/[0.045]"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs text-[#ffd21a]">{workflow.index}</span>
                <span className="text-white/20 transition group-hover:translate-x-1 group-hover:text-[#ffd21a]">→</span>
              </div>
              <h2 className="mt-16 text-2xl font-black uppercase tracking-[-0.04em]">{workflow.label}</h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/40">{workflow.detail}</p>
              <p className="mt-8 text-[10px] font-black uppercase tracking-[0.18em] text-white/30 group-hover:text-[#ffd21a]">
                {workflow.action}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
          <div className="bg-[#080a0f] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">Source boundary</p>
            <p className="mt-3 font-bold">Raw → staging → core</p>
          </div>
          <div className="bg-[#080a0f] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">Required gate</p>
            <p className="mt-3 font-bold">Player and team mappings</p>
          </div>
          <div className="bg-[#080a0f] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">Integrity check</p>
            <Link href="/admin/data-health/pubg-blocked-promotions" className="mt-3 inline-block font-bold text-[#ffd21a] hover:text-white">Blocked promotions →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
