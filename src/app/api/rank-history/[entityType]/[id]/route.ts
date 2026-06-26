import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: Request,
  context: {
    params: Promise<{
      entityType: string;
      id: string;
    }>;
  }
) {
  const { entityType, id } = await context.params;

  const { data, error } = await supabase
    .from("ranking_history")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", id)
    .order("snapshot_date", { ascending: true });

  if (error) 
  {
    return NextResponse.json
    (
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
export function calculateMomentum(history: any[]) 
{
  if (!history || history.length < 2) 
  {
    return {
      momentum: 0,
      trend: "stable",
    };
  }

  const last = history[history.length - 1];
  const prev = history[history.length - 2];

  const diff = prev.rank - last.rank;

  const momentum = diff * 10 + (last.score || 0) * 0.05;
  let trend = "stable";

  if (diff > 0) trend = "up";
  else if (diff < 0) trend = "down";

  return {
    momentum: Math.round(momentum),
    trend,
    change: diff,
  };
}
export function calculateStreak(matches: any[]) 
{
  if (!matches || matches.length === 0) 
  {
    return { streak: 0, type: "none" };
  }

  let streak = 0;
  let type = null;

  for (let i = matches.length - 1; i >= 0; i--) 
  {
    const match = matches[i];

    const isWin = match.result === "win";

    if (type === null) 
    {
      type = isWin ? "win" : "loss";
      streak = 1;
    } else if 
    (
      (type === "win" && isWin) || (type === "loss" && !isWin)
    ) 
    {
      streak++;
    } else 
    {
      break;
    }
  }

  return { streak, type };
}
export function detectForm(momentum: number) 
{
  if (momentum >= 50) return "HOT";
  if (momentum >= 20) return "WARM";
  if (momentum >= 0) return "NEUTRAL";
  return "COLD";
}