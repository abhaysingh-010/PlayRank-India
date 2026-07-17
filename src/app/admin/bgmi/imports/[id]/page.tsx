import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import BgmiTeamResolutionPanel from "@/components/admin/BgmiTeamResolutionPanel";

export const dynamic = "force-dynamic";

type Team = { id: string; name: string };

function normalized(value: string) {
  return value
    .toLowerCase()
    .replace(/\(indian team\)/g, "")
    .replace(/\b(team|esports|gaming|official)\b/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function score(source: string, candidate: string) {
  const left = normalized(source);
  const right = normalized(candidate);
  if (!left || !right) return 0;
  if (left === right) return 100;
  if (left.includes(right) || right.includes(left)) return 85;
  const leftSet = new Set(left);
  const overlap = [...new Set(right)].filter((char) => leftSet.has(char)).length;
  return Math.round((overlap / Math.max(new Set(left).size, new Set(right).size)) * 65);
}

export default async function BgmiImportReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: batch }, { data: rows }, { data: teams }] = await Promise.all([
    supabaseAdmin.from("import_batches").select("*").eq("id", id).single(),
    supabaseAdmin
      .from("bgmi_import_rows")
      .select("team_name,status")
      .eq("import_batch_id", id),
    supabaseAdmin.from("teams").select("id,name").order("name"),
  ]);

  if (!batch) notFound();

  const allRows = rows || [];
  const counts = allRows.reduce(
    (summary, row) => {
      if (row.status in summary) summary[row.status as keyof typeof summary] += 1;
      return summary;
    },
    { matched: 0, unresolved: 0, invalid: 0, imported: 0, pending: 0 }
  );

  const grouped = new Map<string, number>();
  for (const row of allRows) {
    if (row.status === "unresolved") {
      grouped.set(row.team_name, (grouped.get(row.team_name) || 0) + 1);
    }
  }

  const teamList = (teams || []) as Team[];
  const groups = [...grouped].map(([sourceTeamName, affectedRows]) => ({
    sourceTeamName,
    affectedRows,
    candidates: teamList
      .map((team) => ({ ...team, score: score(sourceTeamName, team.name) }))
      .filter((team) => team.score >= 35)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
  }));

  return (
    <main className="min-h-screen bg-[#030406] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-[1500px] px-5 py-12 md:px-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f4473b]">BGMI import review</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-6xl">{batch.batch_name}</h1>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Rows", allRows.length],
              ["Matched", counts.matched],
              ["Unresolved", counts.unresolved],
              ["Invalid", counts.invalid],
            ].map(([label, value]) => (
              <div key={String(label)} className="border border-white/10 bg-white/[0.025] p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/35">{label}</p>
                <p className="mt-2 text-3xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-10 md:px-8">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffd21a]">Team aliases</p>
          <h2 className="mt-2 text-2xl font-black">Resolve uncertain source names</h2>
          <p className="mt-2 text-sm text-white/40">Approval stores a reusable alias and revalidates every affected row in this batch.</p>
        </div>
        <BgmiTeamResolutionPanel batchId={id} groups={groups} allTeams={teamList} />
      </section>
    </main>
  );
}

