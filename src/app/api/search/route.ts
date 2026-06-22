import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: Request) 
{

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""
  if (!q) {return NextResponse.json([])}
  const { data: players } = await supabase.from("players").select("id, ign, slug").ilike("ign", `%${q}%`).limit(5)
  const { data: teams } = await supabase.from("teams").select("id, name, slug").ilike("name", `%${q}%`).limit(5)

  const { data: tournaments } = await supabase.from("tournaments").select("id, name, slug").ilike("name", `%${q}%`).limit(5)

  return NextResponse.json
  (
    [
      ...(players || []).map
      ((p) => 
        (
          {
            ...p,type: "player",
          }
        )
      ),

      ...(teams || []).map
      ((t) => 
        (
          {
            ...t,type: "team",
          }
        )
      ),

      ...(tournaments || []).map
      (
        (t) => 
        (
          {
            ...t,type: "tournament",
          }
        )
      ),
    ]
  )
}