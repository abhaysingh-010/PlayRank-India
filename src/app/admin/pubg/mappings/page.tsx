import Link from "next/link";
import { revalidatePath } from "next/cache";
import DataSourceBadge from "@/components/DataSourceBadge";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type Tone = "neutral" | "healthy" | "warning" | "danger";

type MappingRow = {
  id: string;
  pubg_player_account_id: string;
  pubg_player_name: string | null;
  player_id: string | null;
  mapping_status: string | null;
  confidence_score: number | null;
  verified: boolean | null;
  updated_at: string | null;
};

type PlayerRow = {
  id: string;
  ign: string;
  slug: string;
  team_id: string | null;
};

type TeamRow = {
  id: string;
  name: string;
  slug: string;
};

const shell =
  "rounded-[2rem] border border-white/10 bg-[#080a0f] shadow-[0_24px_80px_rgba(0,0,0,0.28)]";

const panel =
  "rounded-2xl border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function toneStyle(tone: Tone) {
  if (tone === "healthy") {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  }

  if (tone === "warning") {
    return "border-yellow-400/25 bg-yellow-400/10 text-yellow-300";
  }

  if (tone === "danger") {
    return "border-red-400/25 bg-red-400/10 text-red-300";
  }

  return "border-white/10 bg-white/[0.04] text-white/60";
}

function getMappingTone(mapping: MappingRow): Tone {
  if (mapping.verified) return "healthy";
  if (mapping.player_id) return "warning";
  return "danger";
}

function getMappingLabel(mapping: MappingRow) {
  if (mapping.verified) return "verified";
  if (mapping.player_id) return mapping.mapping_status || "mapped";
  return "unmapped";
}

function formatDate(value: string | null) {
  if (!value) return "Not updated";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatBlock({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: Tone;
}) {
  return (
    <div className={panel + " p-4"}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>

      <p
        className={`mt-2 text-3xl font-black ${
          tone === "healthy"
            ? "text-emerald-300"
            : tone === "warning"
              ? "text-yellow-300"
              : tone === "danger"
                ? "text-red-300"
                : "text-white"
        }`}
      >
        {value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  actionHref,
  actionLabel,
}: {
  eyebrow: string;
  title: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ffd21a]">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
          {title}
        </h2>
      </div>

      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="w-fit text-sm font-black text-white/40 transition hover:text-[#ffd21a]"
        >
          {actionLabel} →
        </Link>
      ) : null}
    </div>
  );
}

async function updatePlayerMapping(formData: FormData) {
  "use server";

  const mappingId = formData.get("mapping_id")?.toString();
  const playerId = formData.get("player_id")?.toString();
  const verified = formData.get("verified") === "on";

  if (!mappingId) {
    throw new Error("Missing mapping_id");
  }

  const cleanedPlayerId = playerId && playerId !== "none" ? playerId : null;
  const nextStatus = cleanedPlayerId
    ? verified
      ? "verified"
      : "manual_mapped"
    : "unmapped";

  const nextConfidence = cleanedPlayerId ? (verified ? 1 : 0.85) : 0;

  const { error } = await supabaseAdmin
    .from("pubg_player_mappings")
    .update({
      player_id: cleanedPlayerId,
      mapping_status: nextStatus,
      confidence_score: nextConfidence,
      verified,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mappingId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/pubg/mappings");
  revalidatePath("/admin/pubg/imports");
  revalidatePath("/admin/pubg");
  revalidatePath("/admin/data-health");
}

function MappingCard({
  mapping,
  players,
  playerById,
  teamById,
}: {
  mapping: MappingRow;
  players: PlayerRow[];
  playerById: Map<string, PlayerRow>;
  teamById: Map<string, TeamRow>;
}) {
  const mappedPlayer = mapping.player_id
    ? playerById.get(mapping.player_id)
    : null;

  const mappedTeam = mappedPlayer?.team_id
    ? teamById.get(mappedPlayer.team_id)
    : null;

  const tone = getMappingTone(mapping);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="grid gap-5 xl:grid-cols-[1.05fr_1fr_1.15fr] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${toneStyle(
                tone
              )}`}
            >
              {getMappingLabel(mapping)}
            </span>

            <DataSourceBadge label="PUBG Player" />
          </div>

          <h3 className="mt-3 truncate text-xl font-black tracking-[-0.04em] text-white">
            {mapping.pubg_player_name || "Unknown PUBG Player"}
          </h3>

          <p className="mt-2 break-all text-xs text-white/40">
            {mapping.pubg_player_account_id}
          </p>

          <p className="mt-2 text-xs text-white/35">
            Confidence {n(mapping.confidence_score).toFixed(2)} · Updated{" "}
            {formatDate(mapping.updated_at)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
            Current Mapping
          </p>

          {mappedPlayer ? (
            <div className="mt-3">
              <Link
                href={`/players/${mappedPlayer.slug}`}
                className="font-black text-white transition hover:text-[#ffd21a]"
              >
                {mappedPlayer.ign}
              </Link>

              <p className="mt-1 text-sm text-white/45">
                Team: {mappedTeam?.name || "No team linked"}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm font-black text-red-300">
              No PlayRank player mapped.
            </p>
          )}
        </div>

        <form action={updatePlayerMapping} className="space-y-3">
          <input type="hidden" name="mapping_id" value={mapping.id} />

          <select
            name="player_id"
            defaultValue={mapping.player_id || "none"}
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none"
          >
            <option value="none">No mapping</option>

            {players.map((player) => {
              const team = player.team_id ? teamById.get(player.team_id) : null;

              return (
                <option key={player.id} value={player.id}>
                  {player.ign}
                  {team ? ` - ${team.name}` : " - No Team"}
                </option>
              );
            })}
          </select>

          <label className="flex items-center gap-3 text-sm text-white/60">
            <input
              type="checkbox"
              name="verified"
              defaultChecked={mapping.verified === true}
              className="h-4 w-4"
            />
            Mark as verified
          </label>

          <button
            type="submit"
            className="w-full rounded-xl border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#ffd21a] transition hover:bg-[#ffd21a]/15"
          >
            Save Mapping
          </button>
        </form>
      </div>
    </article>
  );
}

export default async function PubgMappingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const selectedStatus = params.status || "all";
  const searchQuery = (params.q || "").trim();
  const normalizedSearchQuery = searchQuery.toLowerCase();

  const [mappingsResult, playersResult, teamsResult] = await Promise.all([
    supabaseAdmin
      .from("pubg_player_mappings")
      .select(
        "id, pubg_player_account_id, pubg_player_name, player_id, mapping_status, confidence_score, verified, updated_at"
      )
      .order("verified", { ascending: true })
      .order("confidence_score", { ascending: false })
      .order("pubg_player_name", { ascending: true })
      .limit(1000),

    supabaseAdmin
      .from("players")
      .select("id, ign, slug, team_id")
      .order("ign", { ascending: true }),

    supabaseAdmin
      .from("teams")
      .select("id, name, slug")
      .order("name", { ascending: true }),
  ]);

  const mappings = (mappingsResult.data || []) as MappingRow[];
  const players = (playersResult.data || []) as PlayerRow[];
  const teams = (teamsResult.data || []) as TeamRow[];

  const playerById = new Map(players.map((player) => [player.id, player]));
  const teamById = new Map(teams.map((team) => [team.id, team]));

  const statusFilteredMappings = mappings.filter((mapping) => {
    if (selectedStatus === "unmapped") return !mapping.player_id;
    if (selectedStatus === "mapped") {
      return Boolean(mapping.player_id) && mapping.verified !== true;
    }
    if (selectedStatus === "verified") return mapping.verified === true;
    return true;
  });

  const visibleMappings =
    normalizedSearchQuery.length > 0
      ? statusFilteredMappings.filter((mapping) => {
          const mappedPlayer = mapping.player_id
            ? playerById.get(mapping.player_id)
            : null;

          const haystack = [
            mapping.pubg_player_name,
            mapping.pubg_player_account_id,
            mapping.mapping_status,
            mappedPlayer?.ign,
            mappedPlayer?.slug,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(normalizedSearchQuery);
        })
      : statusFilteredMappings;

  const totalMappings = mappings.length;
  const verifiedMappings = mappings.filter(
    (row) => row.verified === true
  ).length;
  const mappedMappings = mappings.filter((row) => row.player_id).length;
  const unmappedMappings = mappings.filter((row) => !row.player_id).length;

  const tableErrors = [
    ["pubg_player_mappings", mappingsResult.error?.message],
    ["players", playersResult.error?.message],
    ["teams", teamsResult.error?.message],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  const filters = [
    { label: "All", value: "all" },
    { label: "Unmapped", value: "unmapped" },
    { label: "Mapped", value: "mapped" },
    { label: "Verified", value: "verified" },
  ];

  return (
    <main className="min-h-screen bg-[#030406] text-white">
      <section className="border-b border-white/10 bg-[#050609]">
        <div className="mx-auto max-w-7xl px-5 py-12 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="flex flex-wrap gap-2">
                <DataSourceBadge label="Admin Console" size="md" />
                <DataSourceBadge label="PUBG Mappings" size="md" />
                <DataSourceBadge label="Promotion Gate" size="md" />
              </div>

              <h1 className="mt-7 text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-7xl">
                PUBG Player
                <br />
                Mapping
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-7 text-white/50">
                Map imported PUBG API player account IDs to verified PlayRank
                player records. Promotion should happen only after identities,
                teams and roster safety are clean.
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
                  href="/admin/data-health"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
                >
                  Data Health
                </Link>

                <Link
                  href="/admin"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
                >
                  Admin Home
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatBlock label="Total" value={totalMappings} />
              <StatBlock
                label="Mapped"
                value={mappedMappings}
                tone={mappedMappings > 0 ? "warning" : "neutral"}
              />
              <StatBlock
                label="Verified"
                value={verifiedMappings}
                tone={verifiedMappings > 0 ? "healthy" : "neutral"}
              />
              <StatBlock
                label="Unmapped"
                value={unmappedMappings}
                tone={unmappedMappings === 0 ? "healthy" : "danger"}
              />
            </div>
          </div>
        </div>
      </section>

      {tableErrors.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-8">
          <div className="rounded-2xl border border-red-400/25 bg-red-400/10 p-5">
            <p className="font-black uppercase text-red-300">
              Failed to load mapping data
            </p>

            <div className="mt-4 space-y-2">
              {tableErrors.map(([table, error]) => (
                <p key={table} className="text-sm text-white/60">
                  {table}: {error}
                </p>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 lg:grid-cols-[0.85fr_1.15fr]">
        <section className={shell + " p-5 md:p-6"}>
          <SectionHeader
            eyebrow="Mapping Filters"
            title="Search & Review"
          />

          <form
            action="/admin/pubg/mappings"
            className="grid gap-3"
          >
            <input type="hidden" name="status" value={selectedStatus} />

            <input
              name="q"
              defaultValue={searchQuery}
              placeholder="Search PUBG name, account ID, or PlayRank IGN..."
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            />

            <button
              type="submit"
              className="rounded-xl border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#ffd21a] transition hover:bg-[#ffd21a]/15"
            >
              Search
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {filters.map((filter) => {
              const href =
                searchQuery.length > 0
                  ? `/admin/pubg/mappings?status=${
                      filter.value
                    }&q=${encodeURIComponent(searchQuery)}`
                  : `/admin/pubg/mappings?status=${filter.value}`;

              return (
                <Link
                  key={filter.value}
                  href={href}
                  className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${
                    selectedStatus === filter.value
                      ? "border-[#ffd21a]/40 bg-[#ffd21a]/10 text-[#ffd21a]"
                      : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"
                  }`}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-yellow-300">
              Promotion Rule
            </p>

            <p className="mt-2 text-sm leading-6 text-white/60">
              A mapping should be verified only when the PUBG identity clearly
              belongs to the selected PlayRank player and that player has safe
              team/roster context.
            </p>
          </div>
        </section>

        <section className={shell + " p-5 md:p-6"}>
          <SectionHeader
            eyebrow="Mapping Queue"
            title="Imported PUBG Players"
            actionHref="/admin/pubg/imports"
            actionLabel="Review Imports"
          />

          <p className="mb-5 text-sm text-white/45">
            Showing {visibleMappings.length.toLocaleString("en-IN")} of{" "}
            {mappings.length.toLocaleString("en-IN")} mappings
            {searchQuery ? ` for "${searchQuery}"` : ""}.
          </p>

          <div className="grid max-h-[900px] gap-4 overflow-y-auto pr-1">
            {visibleMappings.length === 0 ? (
              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5">
                <p className="text-lg font-black text-yellow-300">
                  No mappings found.
                </p>

                <p className="mt-2 text-sm text-white/55">
                  Try a different PUBG player name, account ID, PlayRank IGN, or
                  filter.
                </p>
              </div>
            ) : null}

            {visibleMappings.map((mapping) => (
              <MappingCard
                key={mapping.id}
                mapping={mapping}
                players={players}
                playerById={playerById}
                teamById={teamById}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}