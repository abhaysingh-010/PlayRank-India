import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default async function StandingsPage() {

  const { data: standings } = await supabase.from("tournament_standings").select(`*,teams (id,name,short_name,slug)`)
  // Aggregate team stats
  const teamMap = new Map()
  standings?.forEach
  (
    (row: any) => 
    {
      const teamId = row.team_id
      if (!teamMap.has(teamId)) 
      {
        teamMap.set
        (teamId, 
          {
            ...row.teams,
            totalPoints: 0,
            totalKills: 0,
            tournamentsPlayed: 0,
          }
        )
      }
      const team = teamMap.get(teamId)
      team.totalPoints += row.points || 0
      team.totalKills += row.kills || 0
      team.tournamentsPlayed += 1
    }
  )
  const leaderboard = Array.from(teamMap.values()).sort((a: any, b: any) => b.totalPoints - a.totalPoints)

  return (
    <main className="max-w-7xl mx-auto px-6 py-14 text-white">
      {/* HEADER */}
      <div className="mb-14">
        <p className="uppercase tracking-wide text-sm text-zinc-500">Global Rankings</p>
        <h1 className="text-6xl font-black mt-4">Team Standings</h1>
        <p className="text-zinc-400 mt-4 text-lg">Explore the strongest esports teams across tournaments</p>
      </div>
      {/* STANDINGS */}
      <div className="space-y-5">
        {leaderboard.map
          ((team: any, index: number) => 
            (
              <Link key={team.id} href={`/teams/${team.slug}`}className="group block rounded-[28px] border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition p-8">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
                  {/* LEFT */}
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <h2 className="text-3xl font-black text-indigo-400">#{index + 1}</h2>
                    </div>
                    <div>
                      <h2 className="text-4xl font-black">{team.short_name}</h2>
                      <p className="text-zinc-400 mt-2">{team.name}</p>
                    </div>
                  </div>
                  {/* STATS */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white/[0.03] rounded-2xl p-5 min-w-[140px]">
                      <p className="text-zinc-500 text-sm">Points</p>
                      <h3 className="text-2xl font-black mt-2">{team.totalPoints}</h3>
                    </div>
                    <div className="bg-white/[0.03] rounded-2xl p-5 min-w-[140px]">
                      <p className="text-zinc-500 text-sm">Kills</p>
                      <h3 className="text-2xl font-black mt-2">{team.totalKills}</h3>
                    </div>
                    <div className="bg-white/[0.03] rounded-2xl p-5 min-w-[140px]">
                      <p className="text-zinc-500 text-sm">Tournaments</p>
                      <h3 className="text-2xl font-black mt-2">{team.tournamentsPlayed}</h3>
                    </div>
                  </div>
                </div>
              </Link>
            )
          )
        }
      </div>
    </main>
  )
}