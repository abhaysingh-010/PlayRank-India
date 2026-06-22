import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("pubg_match_promotion_readiness")
    .select("*")
    .order("created_at_api", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch PUBG promotion readiness",
        details: error.message,
      },
      { status: 500 }
    );
  }

  const summary = {
    total_imported_matches: data?.length ?? 0,
    ready_for_promotion:
      data?.filter((row) => row.promotion_allowed === true).length ?? 0,
    blocked:
      data?.filter((row) => row.promotion_allowed !== true).length ?? 0,
  };

  return NextResponse.json({
    ok: true,
    summary,
    matches: data ?? [],
  });
}