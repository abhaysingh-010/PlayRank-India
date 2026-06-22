import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default async function MVPPage() {

  // PLAYER RANKINGS
  const { data: playerRankings } = await supabase.from("rankings").select("*").eq("entity_type", "player").order("score", { ascending: false })
  const playerIds = playerRankings?.map((p) => p.entity_id) ?? []
  const { data: players } = await supabase.from("players").select("*").in("id", playerIds)
  const leaderboard = playerRankings?.map
  ((rank) => 
    (
      {
        ...rank,
        player: players?.find
        (
          (p) => p.id === rank.entity_id
        ),
      }
    )
  ) 
  ?? []

  return (
    <main className="max-w-7xl mx-auto px-6 py-14 text-white">
      {/* HEADER */}
      <div className="mb-14">
        <p className="uppercase tracking-wide text-sm text-zinc-500">Elite Performance</p>
        <h1 className="text-6xl font-black mt-4">🏆 MVP Leaderboard</h1>
        <p className="text-zinc-400 mt-4 text-lg">Discover the highest-performing players</p>
      </div>

      {/* LIST */}
      <div className="space-y-5">
        {leaderboard.map
          ((item: any, index: number) => 
            (
              <Link key={item.id} href={`/players/${item.player?.slug}`} className="group block rounded-[28px] border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition p-8">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
                  {/* LEFT */}
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                      <h2 className="text-3xl font-black text-yellow-400">#{index + 1}</h2>
                    </div>
                    <div>
                      <h2 className="text-4xl font-black">{item.player?.ign}</h2>
                      <p className="text-zinc-400 mt-2">{item.player?.team}</p>
                    </div>
                  </div>

                  {/* STATS */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white/[0.03] rounded-2xl p-5 min-w-[140px]">
                      <p className="text-zinc-500 text-sm">Score</p>
                      <h3 className="text-2xl font-black mt-2">{item.score}</h3>
                    </div>
                    <div className="bg-white/[0.03] rounded-2xl p-5 min-w-[140px]">
                      <p className="text-zinc-500 text-sm">Rank</p>
                      <h3 className="text-2xl font-black mt-2">#{item.rank}</h3>
                    </div>
                    <div className="bg-white/[0.03] rounded-2xl p-5 min-w-[140px]">
                      <p className="text-zinc-500 text-sm">Change</p>
                      <h3 className={`text-2xl font-black mt-2 ${ item.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {item.change >= 0 ? "↑" : "↓"}
                        {Math.abs(item.change)}
                      </h3>
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