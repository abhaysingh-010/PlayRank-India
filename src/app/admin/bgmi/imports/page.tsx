import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function BgmiImportsPage() {
  const { data: batches } = await supabaseAdmin
    .from("bgmi_import_batch_summary")
    .select("*")
    .order("batch_id", { ascending: false })
    .limit(50);

  return (
    <main className="min-h-screen bg-[#030406] text-white">
      <section className="mx-auto max-w-[1500px] px-5 py-12 md:px-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f4473b]">BGMI data operations</p>
        <h1 className="mt-4 text-5xl font-black uppercase tracking-[-0.06em] md:text-7xl">Import review.</h1>
        <div className="mt-10">
          {(batches || []).map((batch) => (
            <Link
              key={batch.batch_id}
              href={"/admin/bgmi/imports/" + batch.batch_id}
              className="grid gap-4 border-t border-white/10 py-5 transition hover:bg-white/[0.025] md:grid-cols-[1fr_repeat(4,100px)]"
            >
              <div>
                <p className="font-black">{batch.batch_name}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-white/30">{batch.batch_status}</p>
              </div>
              <p><span className="text-white/30">Rows </span>{batch.total_rows}</p>
              <p><span className="text-white/30">Matched </span>{batch.matched_rows}</p>
              <p><span className="text-white/30">Open </span>{batch.unresolved_rows}</p>
              <p><span className="text-white/30">Invalid </span>{batch.invalid_rows}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

