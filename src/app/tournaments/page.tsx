import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Tournament = {
  id: string;
  name: string;
  slug: string;
  organizer: string | null;
  status: string | null;
  location: string | null;
  prize_pool: number | null;
  participating_teams: number | null;
  start_date: string | null;
  end_date: string | null;
  verified: boolean | null;
  source_url: string | null;
  map_count: number;
  standing_count: number;
  has_coverage: boolean;
};

type SortDirection = "asc" | "desc";
type DirectoryMode = "covered" | "archive";

const SIZE = 10;

function num(value: unknown) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function pageNumber(value?: string) {
  const page = Number.parseInt(value || "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function sortDirection(value?: string): SortDirection {
  return value === "asc" ? "asc" : "desc";
}

function directoryMode(value?: string): DirectoryMode {
  return value === "archive" ? "archive" : "covered";
}

function date(value?: string | null) {
  return value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "TBD";
}

function money(value: unknown) {
  const amount = num(value);
  if (!amount) return "TBD";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function pageHref(page: number, sort: SortDirection, mode: DirectoryMode) {
  return `/tournaments?page=${page}&sort=${sort}&view=${mode}`;
}

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; sort?: string; view?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const page = pageNumber(params.page);
  const sort = sortDirection(params.sort);
  const mode = directoryMode(params.view);
  const offset = (page - 1) * SIZE;

  const eventsResult = await supabase
    .from("tournament_public_coverage")
    .select(
      "id,name,slug,organizer,status,location,prize_pool,participating_teams,start_date,end_date,verified,source_url,map_count,standing_count,has_coverage",
      { count: "exact" },
    )
    .eq("has_coverage", mode === "covered")
    .order("start_date", { ascending: sort === "asc", nullsFirst: false })
    .order("name", { ascending: true })
    .range(offset, offset + SIZE - 1);

  if (eventsResult.error) {
    return (
      <main className="pr-container py-20">
        <h1 className="text-5xl font-semibold text-white">
          Tournaments could not be loaded.
        </h1>
      </main>
    );
  }

  const events = (eventsResult.data || []) as Tournament[];
  const total = eventsResult.count || 0;
  const pages = Math.max(1, Math.ceil(total / SIZE));

  return (
    <main className="bg-[var(--pr-bg)] text-white">
      <section className="border-b border-white/15">
        <div className="pr-container grid gap-12 py-16 md:py-24 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <p className="pr-kicker">Events · organisers · competition</p>
            <h1 className="mt-5 text-[clamp(4.5rem,9vw,9rem)] font-semibold uppercase leading-[.78] tracking-[-.08em]">
              Tournament
              <br />
              <span className="text-[var(--pr-red)]">register.</span>
            </h1>
          </div>
          <div>
            <p className="max-w-xl text-base leading-7 text-white/50">
              {mode === "covered"
                ? "Explore tournaments with published matches or final standings."
                : "Browse historical event records whose detailed scorecards are not yet available."}
            </p>
            <div className="mt-7 flex gap-3">
              <Link href="/standings" className="pr-button pr-button-primary text-[10px]">
                Standings
              </Link>
              <Link href="/matches" className="pr-button pr-button-secondary text-[10px]">
                Matches
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/15">
        <div className="pr-container grid grid-cols-3">
          {[
            [total, "Events"],
            [
              events.filter((event) =>
                (event.status || "").toLowerCase().includes("live"),
              ).length,
              "Live on page",
            ],
            [SIZE, "Events per page"],
          ].map(([value, label]) => (
            <div key={label} className="border-r border-white/15 px-5 py-7 first:border-l">
              <p className="text-2xl font-semibold">{value}</p>
              <p className="mt-2 text-[9px] uppercase tracking-[.15em] text-white/25">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="pr-container py-16 md:py-22">
        <div className="flex flex-col gap-6 border-b border-white/15 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="pr-kicker">Event index · page {page}</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
              Competition calendar.
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
          <div className="flex border border-white/15 p-1" aria-label="Tournament coverage filter">
            <Link href={pageHref(1, sort, "covered")} aria-current={mode === "covered" ? "page" : undefined} className={`px-4 py-3 text-[9px] font-semibold uppercase tracking-[.14em] transition-colors ${mode === "covered" ? "bg-white text-black" : "text-white/40 hover:text-white"}`}>
              Covered
            </Link>
            <Link href={pageHref(1, sort, "archive")} aria-current={mode === "archive" ? "page" : undefined} className={`px-4 py-3 text-[9px] font-semibold uppercase tracking-[.14em] transition-colors ${mode === "archive" ? "bg-white text-black" : "text-white/40 hover:text-white"}`}>
              Archive
            </Link>
          </div>
          <div className="flex border border-white/15 p-1" aria-label="Tournament date order">
            <Link href={pageHref(1, "desc", mode)} aria-current={sort === "desc" ? "page" : undefined} className={`px-4 py-3 text-[9px] font-semibold uppercase tracking-[.14em] transition-colors ${sort === "desc" ? "bg-[var(--pr-red)] text-black" : "text-white/40 hover:text-white"}`}>
              Newest
            </Link>
            <Link href={pageHref(1, "asc", mode)} aria-current={sort === "asc" ? "page" : undefined} className={`px-4 py-3 text-[9px] font-semibold uppercase tracking-[.14em] transition-colors ${sort === "asc" ? "bg-[var(--pr-red)] text-black" : "text-white/40 hover:text-white"}`}>
              Oldest
            </Link>
          </div>
          </div>
        </div>

        <div>
          {events.length ? (
            events.map((event) => {
              const maps = event.map_count || 0;
              const rankedTeams = event.standing_count || 0;
              return (
                <Link key={event.id} href={mode === "covered" ? `/tournaments/${event.slug}` : event.source_url || "/tournaments"} target={mode === "archive" && event.source_url ? "_blank" : undefined} rel={mode === "archive" ? "noreferrer" : undefined} className="pr-ranking-row group grid gap-5 border-b border-white/10 py-6 md:grid-cols-[160px_1.4fr_repeat(3,.6fr)_24px] md:items-center">
                  <div>
                    <p className="font-semibold">{date(event.start_date)}</p>
                    <p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/25">to {date(event.end_date)}</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{event.name}</p>
                    <p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/25">{event.organizer || "Organiser TBD"} · {event.location || "India"}</p>
                  </div>
                  <Stat value={event.status || "Upcoming"} label="Status" />
                  <Stat value={money(event.prize_pool)} label="Prize pool" />
                  <Stat value={mode === "covered" ? `${maps} maps · ${rankedTeams} ranked` : "Open source record"} label={mode === "covered" ? "Event coverage" : "Historical archive"} />
                  <ArrowRight size={15} className="hidden text-white/20 group-hover:text-[var(--pr-red)] md:block" />
                </Link>
              );
            })
          ) : (
            <p className="py-14 text-white/35">No tournaments found.</p>
          )}
        </div>

        <nav className="mt-8 flex items-center justify-between border-t border-white/15 pt-7">
          <p className="text-[10px] uppercase tracking-[.16em] text-white/30">Page {Math.min(page, pages)} of {pages} · {sort === "asc" ? "Oldest first" : "Newest first"}</p>
          <div className="flex gap-2">
            {page > 1 ? <Link href={pageHref(page - 1, sort, mode)} className="pr-button pr-button-secondary text-[10px]">Previous 10</Link> : null}
            {page < pages ? <Link href={pageHref(page + 1, sort, mode)} className="pr-button pr-button-primary text-[10px]">Next 10 <ArrowRight size={13} /></Link> : null}
          </div>
        </nav>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="truncate text-sm font-semibold">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/25">{label}</p>
    </div>
  );
}
