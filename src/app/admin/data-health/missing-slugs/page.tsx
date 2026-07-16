import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import DataSourceBadge from "@/components/DataSourceBadge";

export const dynamic = "force-dynamic";

type IssueType = "team" | "player" | "tournament";

type TeamRow =
{
  id: string;
  name: string;
  short_name: string | null;
  slug: string | null;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
};

type PlayerRow =
{
  id: string;
  ign: string;
  real_name: string | null;
  slug: string | null;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
};

type TournamentRow =
{
  id: string;
  name: string;
  slug: string | null;
  organizer: string | null;
  source: string | null;
  verified: boolean | null;
};

type MissingSlugIssue =
{
  id: string;
  type: IssueType;
  name: string;
  secondary: string;
  source: string | null;
  verified: boolean | null;
  active?: boolean | null;
  suggestedSlug: string;
  adminHref: string;
};

function slugify(value: string)
{
  return value
  .toLowerCase()
  .trim()
  .replace(/&/g, "and")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");
}

function getSourceLabel(source: string | null, verified?: boolean | null)
{
  if (source === "krafton_india_esports") return "Official Krafton";
  if (source === "pubg_api") return "PUBG API";
  if (source === "admin_manual") return "Admin Manual";
  if (verified) return "Verified";
  return "PlayRank Record";
}

function statusBadge(active?: boolean | null)
{
  if (active === false)
    {
    return (
      <span className="rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300">Inactive</span>
    );
  }

  return (
    <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">Active</span>
  );
}

export default async function MissingSlugsPage()
{
  const [teamsResult, playersResult, tournamentsResult] = await Promise.all
  (
    [
      supabaseAdmin
      .from("teams")
      .select("id, name, short_name, slug, source, verified, active")
      .or("slug.is.null,slug.eq.")
      .order("name", { ascending: true }),

      supabaseAdmin
      .from("players")
      .select("id, ign, real_name, slug, source, verified, active")
      .or("slug.is.null,slug.eq.")
      .order("ign", { ascending: true }),

      supabaseAdmin
      .from("tournaments")
      .select("id, name, slug, organizer, source, verified")
      .or("slug.is.null,slug.eq.")
      .order("name", { ascending: true }),
    ]
  );

  const error = teamsResult.error || playersResult.error || tournamentsResult.error;
  const teams = (teamsResult.data || []) as TeamRow[];
  const players = (playersResult.data || []) as PlayerRow[];
  const tournaments = (tournamentsResult.data || []) as TournamentRow[];

  const issues: MissingSlugIssue[] =
  [
    ...teams.map
    (
      (team) =>
      (
        {
          id: team.id,
          type: "team" as const,
          name: team.name,
          secondary: team.short_name || "Team",
          source: team.source,
          verified: team.verified,
          active: team.active,
          suggestedSlug: slugify(team.name),
          adminHref: `/admin/teams?search=${encodeURIComponent(team.name)}`,
        }
      )
    ),

    ...players.map
    (
      (player) =>
      (
        {
          id: player.id,
          type: "player" as const,
          name: player.ign,
          secondary: player.real_name || "Player",
          source: player.source,
          verified: player.verified,
          active: player.active,
          suggestedSlug: slugify(player.ign),
          adminHref: `/admin/players?search=${encodeURIComponent(player.ign)}`,
        }
      )
    ),

    ...tournaments.map
    (
      (tournament) =>
      (
        {
          id: tournament.id,
          type: "tournament" as const,
          name: tournament.name,
          secondary: tournament.organizer || "Tournament",
          source: tournament.source,
          verified: tournament.verified,
          suggestedSlug: slugify(tournament.name),
          adminHref: `/admin/tournaments?search=${encodeURIComponent(tournament.name)}`,
        }
      )
    ),
  ];

  if (error)
  {
    return (
      <main className="page-shell py-10 text-white">
        <section className="border border-red-500/20 bg-red-500/5 p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">Admin Data Health</p>
          <h1 className="mt-3 text-3xl font-black">Missing Slugs</h1>
          <p className="mt-3 text-red-200/80">Failed to load missing-slug records.</p>
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
              <DataSourceBadge label="Missing Slugs" />
              <DataSourceBadge label="Public Route Risk" />
            </div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-[#ffd21a]">Data Issue Detail</p>
            <h1 className="mt-3 text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] md:text-7xl">
              Missing
              <br />
              Slugs
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/50">
              Records listed here do not have a valid slug. Missing slugs can
              break public detail pages, comparison links, search results and
              internal admin navigation.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Open Issues</p>
              <p className="mt-2 text-3xl font-black text-[#ffd21a]">{issues.length.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Priority</p>
              <p className="mt-2 text-3xl font-black">P1</p>
            </div>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/admin/data-health" className="pr-button pr-button-secondary">Back to Data Health</Link>
          <Link href="/admin/teams" className="pr-button pr-button-primary">Admin Teams</Link>
          <Link href="/admin/players" className="pr-button pr-button-secondary">Admin Players</Link>
          <Link href="/admin/tournaments" className="pr-button pr-button-secondary">Admin Tournaments</Link>
        </div>
      </section>
      <section className="overflow-hidden border border-white/10 bg-[#090b10] shadow-2xl">
        <div className="border-b border-white/10 p-6">
          <h2 className="text-2xl font-black">Affected Records</h2>
          <p className="mt-2 text-sm text-white/45">
            Add stable, lowercase URL slugs. Avoid changing slugs after public
            launch unless redirects are implemented.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-[0.22em] text-white/35">
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Record</th>
                <th className="px-6 py-4">Suggested Slug</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {issues.length > 0 ?
                (issues.map
                  (
                    (issue) =>
                    (
                      <tr key={`${issue.type}-${issue.id}`}className="border-b border-white/[0.06] transition hover:bg-white/[0.025]">
                        <td className="px-6 py-5">
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/60">{issue.type}</span>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-black text-white">{issue.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">{issue.secondary}</p>
                        </td>
                        <td className="px-6 py-5">
                          <code className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-[#ffd21a]">{issue.suggestedSlug || "manual-slug-required"}</code>
                        </td>
                        <td className="px-6 py-5">
                          <DataSourceBadge source={issue.source} verified={issue.verified} label={getSourceLabel(issue.source, issue.verified)}/>
                        </td>
                        <td className="px-6 py-5">{statusBadge(issue.active)}</td>
                        <td className="px-6 py-5 text-right">
                          <Link href={issue.adminHref} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60 transition hover:border-[#ffd21a]/30 hover:text-[#ffd21a]">
                            Fix
                          </Link>
                        </td>
                      </tr>
                    )
                  )
                )
                :
                (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-lg font-black text-emerald-300">No missing slugs found.</p>
                      <p className="mt-2 text-sm text-white/45">Team, player and tournament routes are currently clean.</p>
                    </td>
                  </tr>
                )
              }
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
