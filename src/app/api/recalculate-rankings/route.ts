import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() 
{
  await supabase.rpc('calculate_player_scores')

  return NextResponse.json
  (
    {
      success: true
    }
  )
}