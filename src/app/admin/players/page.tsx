"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const inputClass =
  "w-full border border-white/10 bg-[#050609] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#ffd21a]/60 focus:bg-[#090a0d]";

export default function AdminPlayersPage() {
  const [ign, setIgn] = useState("");
  const [role, setRole] = useState("");
  const [country, setCountry] = useState("India");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const slug = slugify(ign);

  const addPlayer = async () => {
    setMessage("");
    if (!ign.trim()) {
      setMessage("IGN is required.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("players").insert({
      ign: ign.trim(),
      slug,
      role: role.trim() || null,
      country: country.trim() || "India",
      active: true,
      verified: false,
      source: "admin_manual",
    });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Player added successfully.");
    setIgn("");
    setRole("");
    setCountry("India");
  };

  return (
    <main className="bg-[#030406] text-white">
      <header className="border-b border-white/10 bg-[#050609]">
        <div className="mx-auto grid max-w-[1500px] gap-8 px-5 py-10 md:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f4473b]">Entity management / players</p>
            <h1 className="mt-4 text-5xl font-black uppercase leading-[0.86] tracking-[-0.065em] md:text-7xl">Player records.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/45">
              Create canonical competitor identities before linking rosters,
              rankings, match performance and external PUBG accounts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/players" className="pr-button pr-button-primary">Public players</Link>
            <Link href="/admin/data-health/players-without-team" className="pr-button pr-button-secondary">Roster gaps</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1500px] gap-6 px-5 py-10 md:px-8 xl:grid-cols-[0.72fr_1.28fr]">
        <aside className="border border-white/10 bg-[#080a0f] p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd21a]">Record contract</p>
          <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.05em]">Identity first.<br />Roster second.</h2>
          <div className="mt-8 space-y-5 border-t border-white/10 pt-6 text-sm leading-6 text-white/45">
            <p><span className="font-bold text-white">01.</span> IGN generates the public player route.</p>
            <p><span className="font-bold text-white">02.</span> New players begin active and unverified.</p>
            <p><span className="font-bold text-white">03.</span> Team and PUBG identity mapping follows in roster workflows.</p>
          </div>
        </aside>

        <section className="border border-white/10 bg-[#080a0f]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">New entity</p>
              <h2 className="mt-1 text-xl font-black uppercase">Add player</h2>
            </div>
            <span className="border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Manual source</span>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Player IGN *</span>
              <input value={ign} onChange={(event) => setIgn(event.target.value)} placeholder="Jonathan" className={inputClass} />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Competitive role</span>
              <input value={role} onChange={(event) => setRole(event.target.value)} placeholder="IGL / Assaulter / Support" className={inputClass} />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Country</span>
              <input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="India" className={inputClass} />
            </label>
          </div>

          <div className="grid gap-4 border-t border-white/10 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30">Generated route</p>
              <p className="mt-2 break-all font-mono text-sm text-white/60">/players/{slug || "player-slug"}</p>
            </div>
            <button onClick={addPlayer} disabled={loading} className="bg-[#f4473b] px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-[#ff5a4f] disabled:cursor-not-allowed disabled:opacity-45">
              {loading ? "Creating…" : "Create player"}
            </button>
          </div>

          {message ? <p role="status" className="border-t border-white/10 px-5 py-4 text-sm text-[#ffd21a] md:px-6">{message}</p> : null}
        </section>
      </section>
    </main>
  );
}
