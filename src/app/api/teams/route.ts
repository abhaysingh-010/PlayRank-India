import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type RankingRow = {
  id: string;
  entity_id: string;
  entity_type: "team";
  rank: number;
  score: number;
  change: number | null;
  updated_at: string | null;
};

type TeamRow = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  country: string | null;
  logo_url: string | null;
  points: number | null;
  wins: number | null;
  kills: number | null;
  matches_played: number | null;
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
    .eq("entity_type", "team")
    .order("rank", { ascending: true })
    .limit(limit);

  if (rankingsError) {
    return jsonResponse(
      {
        ok: false,
        error: "Failed to load team rankings",
      },
      500,
    );
  }

  const rankings = (rankingsRaw || []) as RankingRow[];
  const ids = rankings.map((ranking) => ranking.entity_id);

  if (ids.length === 0) {
    return jsonResponse([]);
  }

  const { data: teamsRaw, error: teamsError } = await supabase
    .from("teams")
    .select(
      "id, name, short_name, slug, country, logo_url, points, wins, kills, matches_played, source, verified, active",
    )
    .in("id", ids)
    .eq("active", true);

  if (teamsError) {
    return jsonResponse(
      {
        ok: false,
        error: "Failed to load team records",
      },
      500,
    );
  }

  const teams = (teamsRaw || []) as TeamRow[];
  const teamById = new Map(teams.map((team) => [team.id, team]));

  const finalData = rankings
    .map((ranking) => {
      const team = teamById.get(ranking.entity_id);

      if (!team) {
        return null;
      }

      return {
        ...ranking,
        team,
      };
    })
    .filter(Boolean);

  return jsonResponse(finalData);
}
