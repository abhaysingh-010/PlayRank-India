import { supabase } from "@/lib/supabase";

export async function getLatestSnapshot() {
  const { data } = await supabase
    .from("rankings")
    .select("snapshot_date")
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .single();

  return data?.snapshot_date ?? null;
}
