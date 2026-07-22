import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import TeamCompareSelector from "@/components/TeamCompareSelector";
import { supabase } from "@/lib/supabase";
type Team = { id: string; name: string; slug: string };
export default async function CompareTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ team1?: string; team2?: string }>;
}) {
  const params = await searchParams;
  if (params.team1 && params.team2 && params.team1 !== params.team2)
    redirect(`/compare/teams/${params.team1}/${params.team2}`);
  const { data, error } = await supabase
    .from("teams")
    .select("id,name,slug")
    .not("slug", "is", null)
    .order("name", { ascending: true });
  const teams = (data || []) as Team[];
  if (error || teams.length < 2)
    return (
      <main className="pr-container py-20">
        <h1 className="text-5xl font-semibold text-white">
          Team comparison is unavailable.
        </h1>
      </main>
    );
  return (
    <main className="bg-[var(--pr-bg)] text-white">
      <section className="border-b border-white/15">
        <div className="pr-container py-14 md:py-20">
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-white/35"
          >
            <ArrowLeft size={13} /> Compare centre
          </Link>
          <div className="mt-14 grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <p className="pr-kicker">Team head-to-head</p>
              <h1 className="mt-5 text-[clamp(4.2rem,8vw,8rem)] font-semibold uppercase leading-[.8] tracking-[-.075em]">
                Choose the
                <br />
                <span className="text-[var(--pr-red)]">matchup.</span>
              </h1>
            </div>
            <p className="max-w-lg text-base leading-7 text-white/50">
              Select two different teams to compare ranking position and
              available competitive output.
            </p>
          </div>
        </div>
      </section>
      <section className="pr-container grid gap-12 py-16 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <p className="pr-kicker">Duel builder</p>
          <div className="mt-6 border-y border-white/15 py-8">
            <TeamCompareSelector teams={teams} />
          </div>
        </div>
        <div>
          <ShieldCheck size={20} className="text-[var(--pr-red)]" />
          <h2 className="mt-5 text-3xl font-semibold tracking-[-.04em]">
            What the report compares.
          </h2>
          <div className="mt-7 divide-y divide-white/10 border-y border-white/15">
            {[
              "Current rank and score",
              "Wins and eliminations",
              "Match volume",
              "Available head-to-head context",
            ].map((item, index) => (
              <div key={item} className="flex gap-5 py-4">
                <span className="text-sm text-[var(--pr-gold)]">
                  0{index + 1}
                </span>
                <p className="text-sm text-white/55">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
