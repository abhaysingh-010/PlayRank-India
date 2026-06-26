import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) 
{
  try 
  {
    let body: 
    {
      external_match_id?: string;
    };

    try 
    {
      body = await request.json();
    } 
    catch 
    {
      return NextResponse.json
      (
        {
          ok: false,
          error: "Invalid JSON body",
          example: 
          {
            external_match_id: "f89445ae-489c-4992-add6-9999f644d55e",
          },
        },
        { status: 400 }
      );
    }

    const externalMatchId = body.external_match_id; 
    if (!externalMatchId) 
    {
      return NextResponse.json
      (
        {
          ok: false,
          error: "Missing external_match_id",
          example: 
          {
            external_match_id: "f89445ae-489c-4992-add6-9999f644d55e",
          },
        },
        { status: 400 }
      );
    }

    const { data: readiness, error: readinessError } = await supabaseAdmin
    .from("pubg_match_promotion_readiness")
    .select("*")
    .eq("external_match_id", externalMatchId)
    .single();

    if (readinessError || !readiness) 
    {
      return NextResponse.json
      (
        {
          ok: false,
          error: "PUBG match readiness record not found",
          details: readinessError?.message,
          external_match_id: externalMatchId,
        },
        { status: 404 }
      );
    }

    if (readiness.promotion_allowed !== true) 
    {
      return NextResponse.json
      (
        {
          ok: false,
          promoted: false,
          blocked: true,
          error: "PUBG match is not ready for PlayRank core promotion",
          reason: readiness.promotion_status,
          readiness,
        },
        { status: 409 }
      );
    }

    return NextResponse.json
    (
      {
        ok: false,
        promoted: false,
        blocked: false,
        error:"Promotion gate passed, but core promotion function is not installed yet.",
        next_step:"Create promote_pubg_api_match_to_playrank_core() before enabling actual promotion.",
        readiness,
      },
      {
        status: 501
      }
    );
  } 
  catch (error) 
  {
    const message = error instanceof Error ? error.message : "Unknown promotion error";
    return NextResponse.json
    (
      {
        ok: false,
        error: message,
      },
      { 
        status: 500 
      }
    );
  }
}