"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const inputClass =
  "w-full border border-white/10 bg-[#050609] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#ffd21a]/60 focus:bg-[#090a0d]";

export default function AdminTournamentsPage() {
  const [name, setName] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [status, setStatus] = useState("Upcoming");
  const [location, setLocation] = useState("India");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const slug = slugify(name);

  const addTournament = async () => {
    setMessage("");
    if (!name.trim()) {
      setMessage("Tournament name is required.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("tournaments").insert({
      name: name.trim(),
      slug,
      organizer: organizer.trim() || null,
      status,
      location: location.trim() || "India",
      source: "admin_manual",
      verified: false,
    });
    setLoading(false);

    if (error) {
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
    <main className="bg-[#030406] text-white">
      <header className="border-b border-white/10 bg-[#050609]">
        <div className="mx-auto grid max-w-[1500px] gap-8 px-5 py-10 md:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f4473b]">
              Entity management / tournaments
            </p>
            <h1 className="mt-4 text-5xl font-black uppercase leading-[0.86] tracking-[-0.065em] md:text-7xl">
              Event records.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/45">
              Establish the event shell used by tournament profiles, standings,
              match context and ranking history.
            </p>
          </div>
          <Link href="/tournaments" className="pr-button pr-button-primary">
            Public tournaments
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1500px] gap-6 px-5 py-10 md:px-8 xl:grid-cols-[0.72fr_1.28fr]">
        <aside className="border border-white/10 bg-[#080a0f] p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd21a]">
            Event lifecycle
          </p>
          <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.05em]">
            Create context.
            <br />
            Attach competition.
          </h2>
          <div className="mt-8 space-y-5 border-t border-white/10 pt-6 text-sm leading-6 text-white/45">
            <p>
              <span className="font-bold text-white">01.</span> Name defines the
              canonical event route.
            </p>
            <p>
              <span className="font-bold text-white">02.</span> Status controls
              the current lifecycle signal.
            </p>
            <p>
              <span className="font-bold text-white">03.</span> Matches and
              standings can be connected afterward.
            </p>
          </div>
        </aside>

        <section className="border border-white/10 bg-[#080a0f]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                New entity
              </p>
              <h2 className="mt-1 text-xl font-black uppercase">
                Add tournament
              </h2>
            </div>
            <span className="border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
              Unverified
            </span>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                Tournament name *
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Battlegrounds Mobile India Series"
                className={inputClass}
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                Organizer
              </span>
              <input
                value={organizer}
                onChange={(event) => setOrganizer(event.target.value)}
                placeholder="Krafton India Esports"
                className={inputClass}
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                Lifecycle status
              </span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className={inputClass}
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Live">Live</option>
                <option value="Completed">Completed</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                Location
              </span>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="India"
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid gap-4 border-t border-white/10 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30">
                Generated route
              </p>
              <p className="mt-2 break-all font-mono text-sm text-white/60">
                /tournaments/{slug || "event-slug"}
              </p>
            </div>
            <button
              onClick={addTournament}
              disabled={loading}
              className="bg-[#f4473b] px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-[#ff5a4f] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {loading ? "Creating…" : "Create tournament"}
            </button>
          </div>

          {message ? (
            <p
              role="status"
              className="border-t border-white/10 px-5 py-4 text-sm text-[#ffd21a] md:px-6"
            >
              {message}
            </p>
          ) : null}
        </section>
      </section>
    </main>
  );
}
