import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function TeamRankingsPage() {
  const { data: rankings } = await supabase.from("rankings").select(`*,team:entity_id(name,slug,country)`).eq("entity_type", "team").order("rank");

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 text-white">
      <h1 className="text-5xl font-bold mb-8">Team Rankings</h1>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-4 text-left">Rank</th>
              <th className="p-4 text-left">Team</th>
              <th className="p-4 text-left">Country</th>
              <th className="p-4 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {rankings?.map
              ((row: any) => 
                (
                  <tr key={row.id}className="border-b border-white/5">
                    <td className="p-4">#{row.rank}</td>
                    <td className="p-4">
                      <Link href={`/teams/${row.team?.slug}`}className="font-semibold">{row.team?.name}</Link>
                    </td>
                    <td className="p-4">{row.team?.country}</td>
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