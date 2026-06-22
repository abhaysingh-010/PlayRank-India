"use client";

type Team = {
  id: string;
  name: string;
  slug: string;
};

export default function TeamCompareSelector({
  teams,
}: {
  teams: Team[];
}) {
  return (
    <section className="card p-8">
      <form
        method="GET"
        action="/teams/compare"
        className="grid md:grid-cols-3 gap-6 items-end"
      >
        <div>
          <label className="block text-sm text-zinc-500 mb-2">
            Team A
          </label>

          <select
            name="team1"
            defaultValue="team-soul"
            className="w-full rounded-2xl bg-zinc-950 border border-white/10 px-4 py-4 text-white outline-none"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.slug}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-zinc-500 mb-2">
            Team B
          </label>

          <select
            name="team2"
            defaultValue="godlike-esports"
            className="w-full rounded-2xl bg-zinc-950 border border-white/10 px-4 py-4 text-white outline-none"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.slug}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-2xl bg-emerald-500 text-black font-bold px-6 py-4 hover:bg-emerald-400 transition"
        >
          Compare Teams
        </button>
      </form>
    </section>
  );
}