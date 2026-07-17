import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest) {
  let body: {
    name?: unknown;
    shortName?: unknown;
    country?: unknown;
    logoUrl?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const name = String(body.name ?? "").trim();
  const shortName = String(body.shortName ?? "").trim();
  const country = String(body.country ?? "").trim() || "India";
  const logoUrl = String(body.logoUrl ?? "").trim();
  const slug = slugify(name);

  if (!name || !slug) {
    return NextResponse.json(
      { ok: false, error: "Team name is required." },
      { status: 400 },
    );
  }

  if (name.length > 120 || shortName.length > 24 || country.length > 80) {
    return NextResponse.json(
      { ok: false, error: "One or more fields are too long." },
      { status: 400 },
    );
  }

  if (logoUrl) {
    try {
      const parsed = new URL(logoUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Unsupported protocol");
      }
    } catch {
      return NextResponse.json(
        { ok: false, error: "Logo URL must be a valid HTTP or HTTPS URL." },
        { status: 400 },
      );
    }
  }

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("teams")
    .select("id,name,slug")
    .eq("slug", slug)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json(
      { ok: false, error: lookupError.message },
      { status: 500 },
    );
  }

  if (existing) {
    return NextResponse.json(
      {
        ok: false,
        error: `A team already exists at /teams/${existing.slug}.`,
      },
      { status: 409 },
    );
  }

  const { data: team, error } = await supabaseAdmin
    .from("teams")
    .insert({
      name,
      short_name: shortName || null,
      slug,
      country,
      logo_url: logoUrl || null,
      active: true,
      verified: false,
      source: "admin_manual",
    })
    .select("id,name,slug")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, team }, { status: 201 });
}
