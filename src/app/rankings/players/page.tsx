import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function PlayerRankingsPage() {
  const { data: rankings } = await supabase.from("rankings").select(`*,player:entity_id(ign,slug,country)`).eq("entity_type", "player").order("rank");

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 text-white">
      <h1 className="text-5xl font-bold mb-8">Player Rankings</h1>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-4 text-left">Rank</th>
              <th className="p-4 text-left">Player</th>
              <th className="p-4 text-left">Country</th>
              <th className="p-4 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {rankings?.map
              ((row: any) => 
                (
                  <tr key={row.id} className="border-b border-white/5">
                    <td className="p-4"> #{row.rank}</td>
                    <td className="p-4">
                      <Link href={`/players/${row.player?.slug}`} className="font-semibold">{row.player?.ign}</Link>
                    </td>
                    <td className="p-4">{row.player?.country}</td>
                    <td className="p-4 text-right">{row.score}</td>
                  </tr>
                )
              )
            }
          </tbody>
        </table>
      </div>
    </main>
  );
}