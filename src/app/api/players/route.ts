import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {

  const { data: rankings, error } = await supabase.from("rankings").select("*").eq("entity_type", "player").order("rank", {ascending: true})
  if (error) {return NextResponse.json([])}
  const ids = rankings?.map((r) => r.entity_id) ?? []
  const { data: players } = await supabase.from("players").select("*").in("id", ids)
  const finalData = rankings?.map
  (
    (rank) => 
    (
      {...rank,player:
        players?.find
        (
          (p) => p.id === rank.entity_id
        )

      }
    )
  ) ?? []
  return NextResponse.json
  (
    finalData
  )
}