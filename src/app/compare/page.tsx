import Link from "next/link";
import { ArrowRight, Swords, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
export default async function ComparePage() {
  const [teams, players, matches] = await Promise.all([
    supabase.from("teams").select("*", { count: "exact", head: true }),
    supabase.from("players").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
  ]);
  return (
    <main className="bg-[var(--pr-bg)] text-white">
      <section className="border-b border-white/15">
        <div className="pr-container grid gap-12 py-16 md:py-24 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <p className="pr-kicker">Head-to-head intelligence</p>
            <h1 className="mt-5 text-[clamp(4.5rem,9vw,9rem)] font-semibold uppercase leading-[.78] tracking-[-.08em]">
              Read the
              <br />
              <span className="text-[var(--pr-red)]">difference.</span>
            </h1>
          </div>
          <p className="max-w-xl text-base leading-7 text-white/50">
            Put two teams or players side by side. See the competitive
            advantage, metric by metric, with the available sample clearly
            identified.
          </p>
        </div>
      </section>
      <section className="border-b border-white/15">
        <div className="pr-container grid grid-cols-3">
          {[
            [teams.count || 0, "Teams"],
            [players.count || 0, "Players"],
            [matches.count || 0, "Match records"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="border-r border-white/15 px-5 py-7 first:border-l"
            >
              <p className="text-2xl font-semibold">{value}</p>
              <p className="mt-2 text-[9px] uppercase tracking-[.15em] text-white/25">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="pr-container grid md:grid-cols-2">
        <Mode
          href="/teams/compare"
          icon={<Swords size={23} />}
          label="Team mode"
          title="Compare organisations."
          body="Ranking, score, wins, eliminations, match volume and competitive output."
        />
        <Mode
          href="/players/compare"
          icon={<Users size={23} />}
          label="Player mode"
          title="Compare competitors."
          body="Rank, impact, kills, average damage, MVP output and role context."
          right
        />
      </section>
      <section className="border-t border-white/15 bg-[var(--pr-surface)]">
        <div className="pr-container py-12">
          <p className="max-w-4xl text-sm leading-7 text-white/40">
            Comparisons describe differences in the available PlayRank record.
            Missing statistics are treated as missing context—not evidence that
            an entity has no performance.
          </p>
        </div>
      </section>
    </main>
  );
}
function Mode({
  href,
  icon,
  label,
  title,
  body,
  right = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  title: string;
  body: string;
  right?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group py-16 md:py-24 ${right ? "md:border-l md:border-white/15 md:pl-12" : "md:pr-12"}`}
    >
      <div className="text-[var(--pr-red)]">{icon}</div>
      <p className="pr-kicker mt-8">{label}</p>
      <h2 className="mt-4 text-4xl font-semibold tracking-[-.055em] md:text-6xl">
        {title}
      </h2>
      <p className="mt-5 max-w-lg text-sm leading-7 text-white/45">{body}</p>
      <p className="mt-10 inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[.17em] text-white/35 group-hover:text-[var(--pr-red)]">
        Build comparison <ArrowRight size={14} />
      </p>
    </Link>
  );
}
