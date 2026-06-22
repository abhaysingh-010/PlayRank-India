"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

function slugify(value: string) 
{
  return value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");
}

export default function AdminTeamsPage() 
{
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [country, setCountry] = useState("India");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const addTeam = async () => 
  {
    setMessage("");
    if (!name.trim()) 
    {
      setMessage("Team name is required.");
      return;
    }
    setLoading(true);
    const slug = slugify(name);
    const { error } = await supabase.from("teams").insert
    (
      {
        name: name.trim(),
        short_name: shortName.trim() || null,
        slug,
        country: country.trim() || "India",
        logo_url: logoUrl.trim() || null,
        active: true,
        verified: false,
        source: "admin_manual",
      }
    );
    setLoading(false);
    if (error) 
    {
      setMessage(error.message);
      return;
    }

    setMessage("Team added successfully.");
    setName("");
    setShortName("");
    setCountry("India");
    setLogoUrl("");
  };

  return (
    <main className="min-h-screen bg-black px-7 py-24 text-white md:px-14">
      <section className="krafton-grid relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07080c] p-8 md:p-12">
        <div className="blueprint-lines" />
        <div className="relative z-10">
          <p className="krafton-label">Admin Console</p>
          <h1 className="krafton-display mt-6 text-[14vw] md:text-[8vw] xl:text-[7rem]">
            TEAM
            <br />
            CONTROL
          </h1>
          <p className="mt-6 max-w-3xl text-base font-black uppercase leading-6 tracking-[-0.03em] text-white/80 md:text-xl">
            Internal shortcut for reviewing team data, creating team records,
            managing slugs, logos and competitive profile coverage.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/teams" className="btn-primary px-6 py-3 text-sm">Open Public Teams</Link>
            <Link href="/admin/data-health"className="btn-secondary px-6 py-3 text-sm">Data Health</Link>
            <Link href="/admin" className="btn-secondary px-6 py-3 text-sm">Admin Home</Link>
          </div>
        </div>
      </section>
      <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="krafton-card p-7">
          <p className="krafton-label">Create Team</p>
          <h2 className="mt-4 text-4xl font-black uppercase tracking-[-0.05em] text-white">Add Team</h2>
          <p className="mt-4 leading-7 text-white/50">
            Add a PlayRank team shell for rankings, rosters, match results,
            profile pages and future PUBG/BGMI mapping workflows.
          </p>
        </div>
        <div className="krafton-card p-7">
          <div className="space-y-4">
            <input value={name}onChange={(e) => setName(e.target.value)}placeholder="Team Name"className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none placeholder:text-white/35"/>
            <input value={shortName}onChange={(e) => setShortName(e.target.value)}placeholder="Short Name, e.g. SOUL / GODL / XS"className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none placeholder:text-white/35"/>
            <input value={country}onChange={(e) => setCountry(e.target.value)}placeholder="Country"className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none placeholder:text-white/35"/>
            <input value={logoUrl}onChange={(e) => setLogoUrl(e.target.value)}placeholder="Logo URL optional"className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none placeholder:text-white/35"/>
            <button onClick={addTeam}disabled={loading}className="w-full rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-emerald-300 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? "Adding..." : "Add Team"}
            </button>
            {message ? 
              (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
                  {message}
                </div>
              ) 
              : null
            }
          </div>
        </div>
      </section>
    </main>
  );
}