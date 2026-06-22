import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function TournamentsPage() {
  const { data: tournaments } = await supabase.from("tournaments").select("*").order("created_at", {ascending: false,});
  return (
    <main className="page-shell py-8 text-white">
      <div className="max-w-7xl mx-auto px-5">
        {/* Header */}
        <section className="mb-10">
          <p className="data-label mb-2">TOURNAMENT CENTER</p>
          <h1 className="text-5xl font-bold">Tournaments</h1>
          <p className="text-zinc-500 mt-4 max-w-2xl">
            Track active tournaments,
            prize pools, participating teams
            and event status across the
            Indian esports ecosystem.
          </p>
        </section>
        {/* Grid */}
        <section className="grid lg:grid-cols-2 gap-6">
          {tournaments?.map((tournament: any) => (
            <Link key={tournament.id}href={`/tournaments/${tournament.slug}`}className="card p-6 hover:border-emerald-500/30 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-semibold">{tournament.name}</h2>
                  <p className="text-zinc-500 mt-2">{tournament.organizer}</p>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${tournament.status === "Live"? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                    {tournament.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div>
                  <p className="text-zinc-500 text-sm">Prize Pool</p>
                  <h3 className="font-semibold mt-1">₹{(tournament.prize_pool / 10000000).toFixed(1)}Cr</h3>
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">Teams</p>
                  <h3 className="font-semibold mt-1">{tournament.participating_teams}</h3>
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">Location</p>
                  <h3 className="font-semibold mt-1">{tournament.location}</h3>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}