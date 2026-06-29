import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type RankingRow = {
  id: string;
  entity_id: string;
  entity_type: "player";
  rank: number;
  score: number;
  change: number | null;
  updated_at: string | null;
};

type PlayerRow = {
  id: string;
  ign: string;
  slug: string;
  country: string | null;
  role: string | null;
  team_id: string | null;
  kd_ratio: number | null;
  avg_damage: number | null;
  win_rate: number | null;
  matches_played: number | null;
  total_kills: number | null;
  mvp_count: number | null;
  recent_form: number | string | null;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
};

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function parseLimit(value: string | null) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return 50;
  if (parsed < 1) return 50;
  if (parsed > 100) return 100;

  return Math.floor(parsed);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get("limit"));

  const { data: rankingsRaw, error: rankingsError } = await supabase
    .from("rankings")
    .select("id, entity_id, entity_type, rank, score, change, updated_at")
    .eq("entity_type", "player")
    .order("rank", { ascending: true })
    .limit(limit);

  if (rankingsError) {
    return jsonResponse(
      {
        ok: false,
        error: "Failed to load player rankings",
      },
      500
    );
  }

  const rankings = (rankingsRaw || []) as RankingRow[];
  const ids = rankings.map((ranking) => ranking.entity_id);

  if (ids.length === 0) {
    return jsonResponse([]);
  }

  const { data: playersRaw, error: playersError } = await supabase
    .from("players")
    .select(
      "id, ign, slug, country, role, team_id, kd_ratio, avg_damage, win_rate, matches_played, total_kills, mvp_count, recent_form, source, verified, active"
    )
    .in("id", ids)
    .eq("active", true);

  if (playersError) {
    return jsonResponse(
      {
        ok: false,
        error: "Failed to load player records",
      },
      500
    );
  }

  const players = (playersRaw || []) as PlayerRow[];
  const playerById = new Map(players.map((player) => [player.id, player]));

  const finalData = rankings
    .map((ranking) => {
      const player = playerById.get(ranking.entity_id);

      if (!player) {
        return null;
      }

      return {
        ...ranking,
        player,
      };
    })
    .filter(Boolean);

  return jsonResponse(finalData);
}