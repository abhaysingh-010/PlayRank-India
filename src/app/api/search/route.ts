import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type SearchType = "player" | "team" | "tournament";

type PlayerSearchRow = {
  id: string;
  ign: string;
  slug: string;
  country: string | null;
};

type TeamSearchRow = {
  id: string;
  name: string;
  slug: string;
  country: string | null;
};

type TournamentSearchRow = {
  id: string;
  name: string;
  slug: string;
  status: string | null;
};

type SearchResult =
  | (PlayerSearchRow & { type: SearchType })
  | (TeamSearchRow & { type: SearchType })
  | (TournamentSearchRow & { type: SearchType });

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function cleanQuery(value: string | null) {
  return (value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[%_]/g, "")
    .slice(0, 60);
}

function parseLimit(value: string | null) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return 5;
  if (parsed < 1) return 5;
  if (parsed > 10) return 10;

  return Math.floor(parsed);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = cleanQuery(searchParams.get("q"));
  const limit = parseLimit(searchParams.get("limit"));

  if (q.length < 2) {
    return jsonResponse([]);
  }

  const searchPattern = `%${q}%`;

  const [playersResult, teamsResult, tournamentsResult] = await Promise.all([
    supabase
      .from("players")
      .select("id, ign, slug, country")
      .eq("active", true)
      .ilike("ign", searchPattern)
      .limit(limit),

    supabase
      .from("teams")
      .select("id, name, slug, country")
      .eq("active", true)
      .ilike("name", searchPattern)
      .limit(limit),

    supabase
      .from("tournaments")
      .select("id, name, slug, status")
      .ilike("name", searchPattern)
      .limit(limit),
  ]);

  const hasError =
    playersResult.error || teamsResult.error || tournamentsResult.error;

  if (hasError) {
    return jsonResponse(
      {
        ok: false,
        error: "Failed to run search",
      },
      500,
    );
  }

  const players = (playersResult.data || []) as PlayerSearchRow[];
  const teams = (teamsResult.data || []) as TeamSearchRow[];
  const tournaments = (tournamentsResult.data || []) as TournamentSearchRow[];

  const results: SearchResult[] = [
    ...players.map((player) => ({
      ...player,
      type: "player" as const,
    })),
    ...teams.map((team) => ({
      ...team,
      type: "team" as const,
    })),
    ...tournaments.map((tournament) => ({
      ...tournament,
      type: "tournament" as const,
    })),
  ];

  return jsonResponse(results);
}
