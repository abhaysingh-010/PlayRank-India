import Link from "next/link";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type MappingRow = 
{
  id: string;
  pubg_player_account_id: string;
  pubg_player_name: string | null;
  player_id: string | null;
  mapping_status: string | null;
  confidence_score: number | null;
  verified: boolean | null;
  updated_at: string | null;
};

type PlayerRow = 
{
  id: string;
  ign: string;
  slug: string;
  team_id: string | null;
};

type TeamRow = 
{
  id: string;
  name: string;
  slug: string;
};

function n(value: unknown, fallback = 0) 
{
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function statusTone(status: string | null, verified: boolean | null) 
{
  if 
  (verified) 
  {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  }
  if 
  (status === "manual_mapped" || status === "auto_matched") 
  {
    return "border-yellow-400/25 bg-yellow-400/10 text-yellow-300";
  }
  return "border-red-400/25 bg-red-400/10 text-red-300";
}

async function updatePlayerMapping(formData: FormData) 
{
  "use server";

  const mappingId = formData.get("mapping_id")?.toString();
  const playerId = formData.get("player_id")?.toString();
  const verified = formData.get("verified") === "on";
  if (!mappingId) 
  {
    throw new Error("Missing mapping_id");
  }
  const cleanedPlayerId = playerId && playerId !== "none" ? playerId : null;
  const nextStatus = cleanedPlayerId? verified? "verified" : "manual_mapped" : "unmapped";
  const nextConfidence = cleanedPlayerId ? (verified ? 1 : 0.85) : 0;
  const { error } = await supabaseAdmin.from("pubg_player_mappings").update
  (
    {
      player_id: cleanedPlayerId,
      mapping_status: nextStatus,
      confidence_score: nextConfidence,
      verified,
      updated_at: new Date().toISOString(),
    }
  ).eq("id", mappingId);
  if (error) 
  {
    throw new Error(error.message);
  }
  revalidatePath("/admin/pubg/mappings");
  revalidatePath("/admin/data-health");
}

async function autoSuggestMappings() 
{
  "use server";
  const { error } = await supabaseAdmin.rpc("refresh_pubg_player_mapping_suggestions");
  if (error) 
  {
    throw new Error(error.message);
  }
  revalidatePath("/admin/pubg/mappings");
  revalidatePath("/admin/data-health");
}

export default async function PubgMappingsPage
(
  {
    searchParams,
  }
  : 
  {
    searchParams: Promise<
    {
      status?: string;
      q?: string;
    }>;
  }
) 
{

  const params = await searchParams;
  const selectedStatus = params.status || "all";
  const searchQuery = (params.q || "").trim();

  const 
  [
    mappingsResult,
    playersResult,
    teamsResult,
  ]
  = await Promise.all
  (
    [
      (
        () => 
        {
          let query = supabaseAdmin
          .from("pubg_player_mappings")
          .select
          (
            "id, pubg_player_account_id, pubg_player_name, player_id, mapping_status, confidence_score, verified, updated_at"
          )
          .order("verified", { ascending: true })
          .order("confidence_score", { ascending: false })
          .order("pubg_player_name", { ascending: true })
          .limit(1000);

          if 
          (selectedStatus === "unmapped") 
          {
            query = query.is("player_id", null);
          }

          if 
          (selectedStatus === "mapped") 
          {
            query = query.not("player_id", "is", null).eq("verified", false);
          }

          if 
          (selectedStatus === "verified") 
          {
            query = query.eq("verified", true);
          }

          return query;
        }
      )
      (),

      supabaseAdmin.from("players").select("id, ign, slug, team_id").order("ign", { ascending: true }),
      supabaseAdmin.from("teams").select("id, name, slug").order("name", { ascending: true }),
    ]
  );

  const mappings = (mappingsResult.data || []) as MappingRow[];
  const players = (playersResult.data || []) as PlayerRow[];
  const teams = (teamsResult.data || []) as TeamRow[];
  const playerById = new Map(players.map((player) => [player.id, player]));
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const normalizedSearchQuery = searchQuery.toLowerCase()
  const visibleMappings = normalizedSearchQuery.length > 0 ? mappings.filter
  (
    (mapping) => 
    {
      const mappedPlayer = mapping.player_id ? playerById.get(mapping.player_id): null;

      const haystack = 
      [
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
    }
  )
  : mappings;
  const totalMappings = mappings.length;
  const verifiedMappings = mappings.filter((row) => row.verified === true).length;
  const mappedMappings = mappings.filter((row) => row.player_id).length;
  const unmappedMappings = mappings.filter((row) => !row.player_id).length;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="border-b border-white/10 px-7 py-20 md:px-14">
        <div className="mx-auto max-w-[1600px]">
          <p className="krafton-label">Admin Console</p>
          <h1 className="mt-5 text-5xl font-black uppercase tracking-[-0.06em] md:text-7xl">
            PUBG Player
            <br />
            Mapping
          </h1>
          <p className="mt-6 max-w-3xl text-white/55">
            Map imported PUBG API player account IDs to verified PlayRank player records.
            Only mapped and team-linked players should be promoted into PlayRank core match data.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/admin/data-health" className="btn-secondary px-6 py-3 text-sm">Data Health</Link>

            <Link href="/admin" className="btn-secondary px-6 py-3 text-sm">Admin Home</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-7 py-10 md:px-14">
        <div className="mx-auto grid max-w-[1600px] gap-5 md:grid-cols-4">
          <div className="krafton-card p-6">
            <p className="data-label">Total PUBG Players</p>
            <p className="mt-3 text-5xl font-black">{totalMappings.toLocaleString("en-IN")}</p>
          </div>

          <div className="krafton-card border-yellow-400/25 p-6">
            <p className="data-label text-yellow-300">Mapped</p>
            <p className="mt-3 text-5xl font-black text-yellow-300">{mappedMappings.toLocaleString("en-IN")}</p>
          </div>

          <div className="krafton-card border-emerald-400/25 p-6">
            <p className="data-label text-emerald-300">Verified</p>
            <p className="mt-3 text-5xl font-black text-emerald-300">{verifiedMappings.toLocaleString("en-IN")}</p>
          </div>

          <div className="krafton-card border-red-400/25 p-6">
            <p className="data-label text-red-300">Unmapped</p>
            <p className="mt-3 text-5xl font-black text-red-300">{unmappedMappings.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </section>

      {mappingsResult.error || playersResult.error || teamsResult.error ? 
        (
          <section className="px-7 py-10 md:px-14">
            <div className="mx-auto max-w-[1600px] border border-red-400/25 bg-red-400/10 p-6">
              <p className="text-red-300 font-black uppercase">Failed to load mapping data</p>
              <pre className="mt-4 whitespace-pre-wrap text-sm text-white/60">
                {mappingsResult.error?.message || playersResult.error?.message || teamsResult.error?.message}
              </pre>
            </div>
          </section>
        ) 
        : null
      }
      <section className="mx-auto max-w-[1600px] px-7 py-14 md:px-14">
        <div className="mb-8 border-b border-white/10 pb-5">
          <p className="krafton-label">Mapping Queue</p>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em]">Imported PUBG Players</h2>
            <p className="mt-3 text-sm text-white/45">
              Showing {visibleMappings.length.toLocaleString("en-IN")}of{" "}{mappings.length.toLocaleString("en-IN")}mappings{searchQuery ? ` for "${searchQuery}"` : ""}.
            </p>
            <div className="flex flex-col gap-3 md:items-end">
              <form action="/admin/pubg/mappings"className="flex w-full gap-2 md:w-[420px]">
                <input type="hidden"name="status"value={selectedStatus}/>
                <input name="q"defaultValue={searchQuery}placeholder="Search PUBG name, account ID, or IGN..."className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"/>
                <button type="submit"className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-emerald-300 hover:bg-emerald-400/20">
                  Search
                </button>
              </form>

              <div className="flex flex-wrap gap-2">
                {
                [
                  { label: "All", value: "all" },
                  { label: "Unmapped", value: "unmapped" },
                  { label: "Mapped", value: "mapped" },
                  { label: "Verified", value: "verified" },
                ].map
                ((filter) => 
                  {
                    const href = searchQuery.length > 0 ? `/admin/pubg/mappings?status=${filter.value}&q=${encodeURIComponent(searchQuery)}`: `/admin/pubg/mappings?status=${filter.value}`;
                    return (
                      <Link key={filter.value}href={href}className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${selectedStatus === filter.value? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"}`}>
                        {filter.label}
                      </Link>
                    );
                  }
                )
              }
            </div>
          </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {visibleMappings.length === 0 ? 
            (
              <div className="border border-yellow-400/20 bg-yellow-400/10 p-6">
                <p className="text-lg font-black uppercase text-yellow-300">No mappings found.</p>
                <p className="mt-2 text-white/55">Try a different PUBG player name, account ID, PlayRank IGN, or filter.</p>
              </div>
            ) : null
          }
          {visibleMappings.map
            ((mapping) => 
              {
                const mappedPlayer = mapping.player_id ? playerById.get(mapping.player_id): null;
                const mappedTeam = mappedPlayer?.team_id ? teamById.get(mappedPlayer.team_id) : null;
                const tone = statusTone(mapping.mapping_status, mapping.verified);

                return (
                  <div key={mapping.id}className="krafton-card p-5">
                    <div className="grid gap-5 xl:grid-cols-[1.3fr_1.5fr_1fr] xl:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-black tracking-[-0.04em]">
                            {mapping.pubg_player_name || "Unknown PUBG Player"}
                          </h3>
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tone}`}>
                            {mapping.verified? "verified" : mapping.mapping_status || "unmapped"}
                          </span>
                        </div>
                        <p className="mt-2 break-all text-xs text-white/40">
                          {mapping.pubg_player_account_id}
                        </p>
                        <p className="mt-2 text-xs text-white/40">
                          Confidence: {n(mapping.confidence_score).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="data-label mb-2">Current PlayRank Mapping</p>
                        {mappedPlayer ? 
                          (
                            <div>
                              <Link href={`/players/${mappedPlayer.slug}`}className="font-black text-white hover:text-emerald-300">
                                {mappedPlayer.ign}
                              </Link>
                              <p className="mt-1 text-sm text-white/45">Team: {mappedTeam?.name || "No team linked"}</p>
                            </div>
                          ) 
                          : 
                          (
                            <p className="text-sm text-red-300">No PlayRank player mapped.</p>
                          )
                        }
                      </div>
                      <form action={updatePlayerMapping} className="space-y-3">
                        <input type="hidden" name="mapping_id"value={mapping.id}/>
                        <select name="player_id" defaultValue={mapping.player_id || "none"} className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm text-white">
                          <option value="none">No mapping</option>
                          {players.map
                            ((player) => 
                              {const team = player.team_id? teamById.get(player.team_id): null;
                                return (
                                  <option key={player.id} value={player.id}>
                                    {player.ign}{team ? ` — ${team.name}` : " — No Team"}
                                  </option>
                                );
                              }
                            )
                          }
                        </select>
                        <label className="flex items-center gap-3 text-sm text-white/60">
                          <input type="checkbox" name="verified"defaultChecked={mapping.verified === true}/>
                          Mark as verified
                        </label>
                        <button type="submit" className="w-full rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-emerald-300 hover:bg-emerald-400/20">
                          Save Mapping
                        </button>
                      </form>
                    </div>
                  </div>
                );
              }
            )
          }
        </div>
      </section>
    </main>
  );
}