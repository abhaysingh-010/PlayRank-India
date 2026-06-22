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

export default function AdminTournamentsPage() 
{
  const [name, setName] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [status, setStatus] = useState("Upcoming");
  const [location, setLocation] = useState("India");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const addTournament = async () => 
  {
    setMessage("");
    if (!name.trim()) 
    {
      setMessage("Tournament name is required.");
      return;
    }
    setLoading(true);
    const slug = slugify(name);
    const { error } = await supabase.from("tournaments").insert
    (
      {
        name: name.trim(),
        slug,
        organizer: organizer.trim() || null,
        status,
        location: location.trim() || "India",
        source: "admin_manual",
        verified: false,
      }
    );
    setLoading(false);
    if (error) 
    {
      setMessage(error.message);
      return;
    }
    setMessage("Tournament added successfully.");
    setName("");
    setOrganizer("");
    setStatus("Upcoming");
    setLocation("India");
  };

  return (
    <main className="min-h-screen bg-black px-7 py-24 text-white md:px-14">
      <section className="krafton-grid relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07080c] p-8 md:p-12">
        <div className="blueprint-lines" />
        <div className="relative z-10">
          <p className="krafton-label">Admin Console</p>
          <h1 className="krafton-display mt-6 text-[14vw] md:text-[8vw] xl:text-[7rem]">
            EVENT
            <br />
            CONTROL
          </h1>
          <p className="mt-6 max-w-3xl text-base font-black uppercase leading-6 tracking-[-0.03em] text-white/80 md:text-xl">
            Internal shortcut for reviewing tournament records, creating events
            and managing event-layer coverage.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/tournaments" className="btn-primary px-6 py-3 text-sm">Open Public Tournaments</Link>

            <Link href="/admin/data-health"className="btn-secondary px-6 py-3 text-sm">Data Health</Link>

            <Link href="/admin" className="btn-secondary px-6 py-3 text-sm">Admin Home</Link>
          </div>
        </div>
      </section>
      <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="krafton-card p-7">
          <p className="krafton-label">Create Tournament</p>
          <h2 className="mt-4 text-4xl font-black uppercase tracking-[-0.05em] text-white">Add Event</h2>
          <p className="mt-4 leading-7 text-white/50">
            Add a tournament shell for event pages, standings, matches and future ranking context.
          </p>
        </div>

        <div className="krafton-card p-7">
          <div className="space-y-4">
            <input value={name}onChange={(e) => setName(e.target.value)}placeholder="Tournament Name"className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none placeholder:text-white/35"/>
            <input value={organizer}onChange={(e) => setOrganizer(e.target.value)}placeholder="Organizer"className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none placeholder:text-white/35"/>
            <select value={status}onChange={(e) => setStatus(e.target.value)}className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none">
              <option value="Upcoming">Upcoming</option>
              <option value="Live">Live</option>
              <option value="Completed">Completed</option>
            </select>
            <input value={location}onChange={(e) => setLocation(e.target.value)}placeholder="Location"className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none placeholder:text-white/35"/>
            <button onClick={addTournament}disabled={loading}className="w-full rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-emerald-300 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? "Adding..." : "Add Tournament"}
            </button>
            {message ? 
              (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">{message}</div>
              ) : null
            }
          </div>
        </div>
      </section>
    </main>
  );
}