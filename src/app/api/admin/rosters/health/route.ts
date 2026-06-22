import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("player_roster_health")
    .select("*")
    .order("health_status", { ascending: true })
    .order("ign", { ascending: true });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch roster health",
        details: error.message,
      },
      { status: 500 }
    );
  }

  const rows = data || [];

  const summary = {
    total_players: rows.length,
    healthy: rows.filter((row) => row.health_status === "healthy").length,
    promotion_safe: rows.filter((row) => row.promotion_safe === true).length,
    issues: rows.filter((row) => row.health_status !== "healthy").length,
    no_team_no_active_roster: rows.filter(
      (row) => row.health_status === "no_team_no_active_roster"
    ).length,
    player_has_team_but_no_active_roster: rows.filter(
      (row) => row.health_status === "player_has_team_but_no_active_roster"
    ).length,
    active_roster_but_player_team_missing: rows.filter(
      (row) => row.health_status === "active_roster_but_player_team_missing"
    ).length,
    player_team_roster_mismatch: rows.filter(
      (row) => row.health_status === "player_team_roster_mismatch"
    ).length,
    multiple_active_rosters: rows.filter(
      (row) => row.health_status === "multiple_active_rosters"
    ).length,
  };

  return NextResponse.json({
    ok: true,
    summary,
    rows,
  });
}