import Link from "next/link";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type PlayerRow = 
{
  id: string;
  ign: string;
  slug: string;
  role: string | null;
  team_id: string | null;
};

type TeamRow = 
{
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
};

type RosterRow = 
{
  id: string;
  team_id: string | null;
  player_id: string | null;
  role: string | null;
  joined_at: string | null;
  left_at: string | null;
  active: boolean | null;
};

function todayDate() 
{
  return new Date().toISOString().slice(0, 10);
}

async function addRoster(formData: FormData) 
{
  "use server";

  const playerId = String(formData.get("player_id") || "");
  const teamId = String(formData.get("team_id") || "");
  const role = String(formData.get("role") || "").trim();

  if (!playerId || !teamId) 
  {
    throw new Error("Player and team are required.");
  }

  await supabaseAdmin
  .from("team_rosters")
  .update
  (
    {
      active: false,
      left_at: todayDate(),
    }
  )
  .eq("player_id", playerId)
  .eq("active", true);

  const { error: rosterError } = await supabaseAdmin.from("team_rosters").insert
  (
    {
      player_id: playerId,
      team_id: teamId,
      role: role || null,
      joined_at: todayDate(),
      active: true,
    }
  );

  if (rosterError) 
  {
    throw new Error(rosterError.message);
  }

  const { error: playerError } = await supabaseAdmin
  .from("players")
  .update
  (
    {
      team_id: teamId,
      role: role || null,
      active: true,
    }
  )
  .eq("id", playerId);

  if (playerError) 
  {
    throw new Error(playerError.message);
  }

  revalidatePath("/admin/rosters");
  revalidatePath("/admin/players");
  revalidatePath("/admin/teams");
  revalidatePath("/admin/pubg");
  revalidatePath("/admin/data-health");
}

async function deactivateRoster(formData: FormData) 
{
  "use server";
  const rosterId = String(formData.get("roster_id") || "");
  const playerId = String(formData.get("player_id") || "");

  if (!rosterId) 
  {
    throw new Error("Roster ID is required.");
  }

  const { error: rosterError } = await supabaseAdmin
  .from("team_rosters")
  .update
  (
    {
      active: false,
      left_at: todayDate(),
    }
  )
  .eq("id", rosterId);

  if (rosterError) 
  {
    throw new Error(rosterError.message);
  }

  if (playerId) 
  {
    await supabaseAdmin
    .from("players")
    .update
    (
      {
        team_id: null,
      }
    )
    .eq("id", playerId);
  }

  revalidatePath("/admin/rosters");
  revalidatePath("/admin/players");
  revalidatePath("/admin/teams");
  revalidatePath("/admin/pubg");
  revalidatePath("/admin/data-health");
}

export default async function AdminRostersPage() 
{
  const [playersResult, teamsResult, rostersResult] = await Promise.all
  (
    [
      supabaseAdmin
      .from("players")
      .select("id, ign, slug, role, team_id")
      .order("ign", { ascending: true }),

      supabaseAdmin
      .from("teams")
      .select("id, name, short_name, slug")
      .order("name", { ascending: true }),

      supabaseAdmin
      .from("team_rosters")
      .select("id, team_id, player_id, role, joined_at, left_at, active")
      .order("active", { ascending: false })
      .order("joined_at", { ascending: false })
      .limit(200),
    ]
  );

  const players = (playersResult.data || []) as PlayerRow[];
  const teams = (teamsResult.data || []) as TeamRow[];
  const rosters = (rostersResult.data || []) as RosterRow[];
  const playerById = new Map(players.map((player) => [player.id, player]));
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const activeRosters = rosters.filter((roster) => roster.active === true);
  const inactiveRosters = rosters.filter((roster) => roster.active !== true);

  return (
    <main className="bg-[#030406] text-white">
      <header className="border-b border-white/10 bg-[#050609]">
        <div className="mx-auto grid max-w-[1500px] gap-8 px-5 py-10 md:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f4473b]">Relationship management / rosters</p>
            <h1 className="mt-4 text-5xl font-black uppercase leading-[0.86] tracking-[-0.065em] md:text-7xl">Roster control.</h1>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-white/45">
            Link players to teams so PlayRank rankings, team profiles, match
            results and PUBG mapping readiness can resolve correctly.
          </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/rosters/health" className="pr-button pr-button-primary">Roster health</Link>
            <Link href="/admin/pubg/mappings" className="pr-button pr-button-secondary">PUBG mappings</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-8">
      <section className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-4">
        <div className="bg-[#080a0f] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">Players</p>
          <p className="mt-3 text-4xl font-black">{players.length}</p>
        </div>
        <div className="bg-[#080a0f] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">Teams</p>
          <p className="mt-3 text-4xl font-black">{teams.length}</p>
        </div>
        <div className="bg-[#080a0f] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">Active rosters</p>
          <p className="mt-3 text-4xl font-black text-emerald-300">{activeRosters.length}</p>
        </div>
        <div className="bg-[#080a0f] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-yellow-300">Inactive rosters</p>
          <p className="mt-3 text-4xl font-black text-yellow-300">{inactiveRosters.length}</p>
        </div>
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="border border-white/10 bg-[#080a0f] p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd21a]">Create relationship</p>
          <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.05em]">Assign player</h2>
          <p className="mt-4 text-sm leading-6 text-white/45">
            Assigning a player to a team updates both `team_rosters` and the
            player&apos;s direct `team_id`. Existing active roster links for that
            player are closed automatically.
          </p>
        </div>
        <form action={addRoster} className="border border-white/10 bg-[#080a0f] p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Player *</span>
            <select name="player_id" required className="w-full border border-white/10 bg-[#050609] px-4 py-3.5 text-sm text-white outline-none focus:border-[#ffd21a]/60">
              <option value="">Select Player</option>
              {players.map
                ((player) => 
                  (
                    <option key={player.id} value={player.id}>{player.ign}</option>
                  )
                )
              }
            </select>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Team *</span>
            <select name="team_id" required className="w-full border border-white/10 bg-[#050609] px-4 py-3.5 text-sm text-white outline-none focus:border-[#ffd21a]/60">
              <option value="">Select Team</option>
              {teams.map
                ((team) => 
                  (
                    <option key={team.id} value={team.id}>{team.name}{team.short_name ? ` (${team.short_name})` : ""}</option>
                 )
                )
              }
            </select>
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Competitive role</span>
            <input name="role" placeholder="IGL / Assaulter / Support" className="w-full border border-white/10 bg-[#050609] px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#ffd21a]/60" />
            </label>
            <button type="submit" className="bg-[#f4473b] px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-[#ff5a4f] md:col-span-2">
              Link Player To Team
            </button>
          </div>
        </form>
      </section>
      <section className="mt-12 pb-4">
        <div className="mb-8 border-b border-white/10 pb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd21a]">Roster links</p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em]">Active team rosters</h2>
        </div>
        <div className="space-y-4">
          {activeRosters.length === 0 ? 
            (
              <div className="border border-yellow-400/20 bg-yellow-400/10 p-6">
                <p className="font-black uppercase text-yellow-300">No active roster links found.</p>
              </div>
            ) : null
          }
          {activeRosters.map
            ((roster) => 
              {
                const player = roster.player_id? playerById.get(roster.player_id): null;
                const team = roster.team_id ? teamById.get(roster.team_id) : null;
                return (
                  <div key={roster.id} className="grid gap-4 border border-white/10 bg-[#080a0f] p-5 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center">
                    <div>
                      <p className="data-label">Player</p>
                      <p className="mt-2 font-black text-white">{player?.ign || "Unknown Player"}</p>
                    </div>
                    <div>
                      <p className="data-label">Team</p>
                      <p className="mt-2 font-black text-white">{team?.name || "Unknown Team"}</p>
                    </div>
                    <div>
                      <p className="data-label">Role</p>
                      <p className="mt-2 font-black text-white">{roster.role || player?.role || "Unassigned"}</p>
                    </div>
                    <form action={deactivateRoster}>
                      <input type="hidden" name="roster_id" value={roster.id} />
                      <input type="hidden"name="player_id"value={roster.player_id || ""}/>
                      <button type="submit" className="border border-red-400/25 bg-red-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-red-300 hover:bg-red-400/20">
                        Deactivate
                      </button>
                    </form>
                  </div>
                );
              }
            )
          }
        </div>
      </section>
      </div>
    </main>
  );
}
