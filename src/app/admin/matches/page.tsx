import Link from "next/link";

export default function AdminMatchesPage() {
  return (
    <main className="min-h-screen bg-black px-7 py-24 text-white md:px-14">
      <section className="krafton-grid relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07080c] p-8 md:p-12">
        <div className="blueprint-lines" />

        <div className="relative z-10">
          <p className="krafton-label">Admin Console</p>

          <h1 className="krafton-display mt-6 text-[14vw] md:text-[8vw] xl:text-[7rem]">
            MATCH
            <br />
            CONTROL
          </h1>

          <p className="mt-6 max-w-3xl text-base font-black uppercase leading-6 tracking-[-0.03em] text-white/80 md:text-xl">
            Internal shortcut for reviewing match data and match intelligence.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/matches" className="btn-primary px-6 py-3 text-sm">
              Open Public Matches
            </Link>

            <Link
              href="/admin/data-health"
              className="btn-secondary px-6 py-3 text-sm"
            >
              Data Health
            </Link>

            <Link href="/admin" className="btn-secondary px-6 py-3 text-sm">
              Admin Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}