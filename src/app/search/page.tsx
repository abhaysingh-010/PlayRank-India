import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function SearchPage({searchParams,}: 
{searchParams: Promise<{ q?: string }>;}) 
{  
  const { q } = await searchParams;
  const { data: players } = await supabase.from("players").select("*").ilike("ign", `%${q}%`).limit(10);
  const { data: teams } = await supabase.from("teams").select("*").ilike("name", `%${q}%`).limit(10);
  const { data: tournaments } = await supabase.from("tournaments").select("*").ilike("name", `%${q}%`).limit(10);

  if (!q) 
  {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">No search query provided.</div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">Search Results for &quot;{q}&quot;</h1>
      {/* Players */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Players</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players?.map
            ((player) => 
              (
                <Link key={player.id} href={`/players/${player.slug}`}className="card p-5">
                  <h3>{player.ign}</h3>
                </Link>
              )
            )
          }
        </div>
      </section>
      {/* Teams */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Teams</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams?.map
            ((team) => 
              (
                <Link key={team.id} href={`/teams/${team.slug}`}className="card p-5">
                  <h3>{team.name}</h3>
                </Link>
              )
            )
          }
        </div>
      </section>
      {/* Tournaments */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Tournaments</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments?.map
            ((tournament) => 
              (
                <Link key={tournament.id} href={`/tournaments/${tournament.slug}`}className="card p-5">
                  <h3>{tournament.name}</h3>
                </Link>
              )
            )
          }
        </div>
      </section>
    </div>
  );
}