import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {

  const { data: rankings, error } = await supabase.from("rankings").select("*").eq("entity_type", "team").order("rank", {ascending: true})
  if (error) {return NextResponse.json([])}
  const ids = rankings?.map
  (
    (r) => r.entity_id
  ) 
  ?? []
  const { data: teams } = await supabase.from("teams").select("*").in("id", ids)
  const finalData = rankings?.map
  (
    (rank) => 
    (
      {
        ...rank,team:teams?.find
        (
          (t) => t.id === rank.entity_id
        )
      }
    )
  ) 
  ?? []

  return NextResponse.json
  (
    finalData
  )
}