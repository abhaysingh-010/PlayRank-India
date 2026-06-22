"use client";

import { useRouter } from "next/navigation";

type Player = {id: string; ign: string; slug: string; role?: string | null;};
export default function PlayerCompareSelector
(
  {players,}: 
  {
  players: Player[];
  }
) 
{
  const router = useRouter();
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) 
  {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const player1 = String(formData.get("player1") || "");
    const player2 = String(formData.get("player2") || "");

    if (!player1 || !player2 || player1 === player2) 
    {
      alert("Select two different players.");
      return;
    }
    router.push(`/compare/players/${player1}/${player2}`);
  }

  return (
    <section className="card p-8">
      <form onSubmit={handleSubmit}className="grid md:grid-cols-3 gap-6 items-end">
        <div>
          <label className="block text-sm text-zinc-500 mb-2">Player A</label>
          <select name="player1"defaultValue="jonathan"className="w-full rounded-2xl bg-zinc-950 border border-white/10 px-4 py-4 text-white outline-none">
            {players.map
              ((player) => 
                (
                  <option key={player.id} value={player.slug}>
                    {player.ign}
                    {player.role ? ` — ${player.role}` : ""}
                  </option>
                )
              )
            }
          </select>
        </div>

        <div>
          <label className="block text-sm text-zinc-500 mb-2">Player B</label>
          <select name="player2"defaultValue="goblin"className="w-full rounded-2xl bg-zinc-950 border border-white/10 px-4 py-4 text-white outline-none">
            {players.map
              ((player) => 
                (
                  <option key={player.id} value={player.slug}>
                    {player.ign}
                    {player.role ? ` — ${player.role}` : ""}
                  </option>
                )
              )
            }
          </select>
        </div>
        <button type="submit"className="rounded-2xl bg-emerald-500 text-black font-bold px-6 py-4 hover:bg-emerald-400 transition">
          Compare Players
        </button>
      </form>
    </section>
  );
}