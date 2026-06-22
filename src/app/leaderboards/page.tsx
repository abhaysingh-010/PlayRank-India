'use client'

import { useEffect, useState } from "react"

export default function LeaderboardsPage() {

  const [tab, setTab] = useState("players")
  const [data, setData] = useState<any[]>([])
  useEffect(() => 
  {
    async function fetchData() 
    {
      const endpoint = tab === "players" ? "/api/players" : "/api/teams"
      const res = await fetch(endpoint)
      const json = await res.json()
      console.log(data)
      console.log("LEADERBOARD DATA", json)
      setData(json)
    }
    fetchData()
  }, [tab])

  return (
    <main className="max-w-7xl mx-auto px-6 py-14 text-white">
      {/* HEADER */}
      <div className="mb-12">
        <p className="uppercase tracking-wide text-sm text-zinc-500">Global Rankings</p>
        <h1 className="text-6xl font-black mt-4">Leaderboards</h1>
      </div>

      {/* FILTERS */}
      <div className="flex gap-4 mb-10">
        <button onClick={()=>setTab("players")}className={`px-6 py-3 rounded-2xl border ${tab === "players" ? "bg-indigo-500 border-indigo-500" : "bg-white/5 border-white/10"}`}>Players</button>
        <button onClick={()=>setTab("teams")}className={`px-6 py-3 rounded-2xl border ${tab === "teams" ? "bg-indigo-500 border-indigo-500" : "bg-white/5 border-white/10"}`}>Teams</button>
      </div>
      {/* LIST */}
      <div className="space-y-4">
        {data.map
          (
            (item: any,index: number) => 
            (
              <a key={item.id} href={tab === "players"? `/players/${item.slug}` : `/teams/${item.team?.slug}`}className="group rounded-[28px] border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition p-7 block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <span className="text-2xl font-black text-indigo-400">#{item.rank}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black">  {tab === "players"? item.player?.ign : item.team?.name}</h2>
                      <p className="text-zinc-500 mt-1">{tab === "players" ? item.player?.team : item.team?.short_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-500 text-sm">Score</p>
                    <h3 className="text-2xl font-black">{item.score}</h3>
                    <p className={`mt-2 font-bold ${ item.change > 0 ? "text-green-400" : "text-red-400"}`}>
                      {item.change > 0 ? "↑" : "↓"}{" "}{Math.abs(item.change)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-500 text-sm">Status</p>
                    <h3 className="font-bold text-green-400">Active</h3>
                  </div>
                </div>
              </a>
            )
          )
        }
      </div>
    </main>
  )
}