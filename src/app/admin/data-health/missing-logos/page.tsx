import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import DataSourceBadge from "@/components/DataSourceBadge";

export const dynamic = "force-dynamic";

type TeamRow = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  country: string | null;
  logo_url: string | null;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
  created_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getTeamSourceLabel(team: TeamRow) {
  if (team.source === "krafton_india_esports") return "Official Krafton";
  if (team.source === "pubg_api") return "PUBG API";
  if (team.source === "admin_manual") return "Admin Manual";
  if (team.verified) return "Verified";
  return "PlayRank Record";
}
export default async function MissingLogosPage() {
  const { data, error } = await supabaseAdmin
    .from("teams")
    .select(
      "id, name, short_name, slug, country, logo_url, source, verified, active, created_at",
    )
    .or("logo_url.is.null,logo_url.eq.")
    .order("name", { ascending: true });

  const teams = (data || []) as TeamRow[];
  if (error) {
    return (
      <main className="page-shell py-10 text-white">
        <section className="border border-red-500/20 bg-red-500/5 p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
            Admin Data Health
          </p>
          <h1 className="mt-3 text-3xl font-black">Missing Team Logos</h1>
          <p className="mt-3 text-red-200/80">
            Failed to load missing-logo records.
          </p>
          <p className="mt-2 text-sm text-red-200/55">{error.message}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell space-y-6 py-8 text-white">
      <section className="border border-white/10 bg-[#07080c] p-7 md:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <DataSourceBadge label="Admin Data Health" />
              <DataSourceBadge label="Missing Logos" />
              <DataSourceBadge label="Manual Fix Required" />
            </div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-[#ffd21a]">
              Data Issue Detail
            </p>
            <h1 className="mt-3 text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] md:text-7xl">
              Missing
              <br />
              Logos
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/50">
              Teams listed here do not have a logo URL. These records should be
              fixed before public launch because missing logos reduce team page,
              ranking, comparison and tournament presentation quality.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Open Issues
              </p>
              <p className="mt-2 text-3xl font-black text-[#ffd21a]">
                {teams.length.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Priority
              </p>
              <p className="mt-2 text-3xl font-black">P1</p>
            </div>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/admin/data-health"
            className="pr-button pr-button-secondary"
          >
            Back to Data Health
          </Link>
          <Link href="/admin/teams" className="pr-button pr-button-primary">
            Open Admin Teams
          </Link>
        </div>
      </section>
      <section className="overflow-hidden border border-white/10 bg-[#090b10] shadow-2xl">
        <div className="border-b border-white/10 p-6">
          <h2 className="text-2xl font-black">Affected Teams</h2>
          <p className="mt-2 text-sm text-white/45">
            Add a valid transparent PNG/SVG logo URL for each team, then rerun
            data health checks.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-[0.22em] text-white/35">
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {teams.length > 0 ? (
                teams.map((team) => (
                  <tr
                    key={team.id}
                    className="border-b border-white/[0.06] transition hover:bg-white/[0.025]"
                  >
                    <td className="px-6 py-5">
                      <p className="font-black text-white">{team.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
                        {team.short_name || "TEAM"}
                      </p>
                    </td>
                    <td className="px-6 py-5 font-mono text-sm text-white/55">
                      {team.slug}
                    </td>
                    <td className="px-6 py-5 text-white/55">
                      {team.country || "India"}
                    </td>
                    <td className="px-6 py-5">
                      <DataSourceBadge
                        source={team.source}
                        verified={team.verified}
                        label={getTeamSourceLabel(team)}
                      />
                    </td>
                    <td className="px-6 py-5">
                      {team.active === false ? (
                        <span className="rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300">
                          Inactive
                        </span>
                      ) : (
                        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-white/45">
                      {formatDate(team.created_at)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/admin/teams?search=${encodeURIComponent(team.name)}`}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60 transition hover:border-[#ffd21a]/30 hover:text-[#ffd21a]"
                      >
                        Fix
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-lg font-black text-emerald-300">
                      No missing team logos found.
                    </p>
                    <p className="mt-2 text-sm text-white/45">
                      This data health check is currently clean.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
