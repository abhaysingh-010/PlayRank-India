"use client";

import Link from "next/link";
import { useState } from "react";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const inputClass =
  "w-full border border-white/10 bg-[#050609] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#ffd21a]/60 focus:bg-[#090a0d]";

export default function AdminTeamsPage() {
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [country, setCountry] = useState("India");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const slug = slugify(name);

  const addTeam = async () => {
    setMessage("");
    if (!name.trim()) {
      setMessage("Team name is required.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/admin/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        shortName: shortName.trim(),
        country: country.trim() || "India",
        logoUrl: logoUrl.trim(),
      }),
    });
    const result = (await response.json()) as {
      ok?: boolean;
      error?: string;
    };
    setLoading(false);

    if (!response.ok) {
      setMessage(result.error || "Unable to create team.");
      return;
    }

    setMessage("Team added successfully.");
    setName("");
    setShortName("");
    setCountry("India");
    setLogoUrl("");
  };

  return (
    <main className="bg-[#030406] text-white">
      <header className="border-b border-white/10 bg-[#050609]">
        <div className="mx-auto grid max-w-[1500px] gap-8 px-5 py-10 md:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f4473b]">
              Entity management / teams
            </p>
            <h1 className="mt-4 text-5xl font-black uppercase leading-[0.86] tracking-[-0.065em] md:text-7xl">
              Team records.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/45">
              Create the canonical team identity used by rankings, rosters,
              match results and PUBG mapping workflows.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/teams" className="pr-button pr-button-primary">
              Public teams
            </Link>
            <Link
              href="/admin/data-health/missing-logos"
              className="pr-button pr-button-secondary"
            >
              Logo issues
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1500px] gap-6 px-5 py-10 md:px-8 xl:grid-cols-[0.72fr_1.28fr]">
        <aside className="border border-white/10 bg-[#080a0f] p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd21a]">
            Record contract
          </p>
          <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.05em]">
            Create once.
            <br />
            Connect everywhere.
          </h2>
          <div className="mt-8 space-y-5 border-t border-white/10 pt-6 text-sm leading-6 text-white/45">
            <p>
              <span className="font-bold text-white">01.</span> Name generates
              the public slug automatically.
            </p>
            <p>
              <span className="font-bold text-white">02.</span> New records
              start active and unverified.
            </p>
            <p>
              <span className="font-bold text-white">03.</span> Roster and
              source mappings can be attached afterward.
            </p>
          </div>
        </aside>
        <section className="border border-white/10 bg-[#080a0f]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                New entity
              </p>
              <h2 className="mt-1 text-xl font-black uppercase">Add team</h2>
            </div>
            <span className="border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
              Manual source
            </span>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                Team name *
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Team Soul"
                className={inputClass}
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                Short name
              </span>
              <input
                value={shortName}
                onChange={(event) => setShortName(event.target.value)}
                placeholder="SOUL"
                className={inputClass}
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                Country
              </span>
              <input
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                placeholder="India"
                className={inputClass}
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                Logo URL
              </span>
              <input
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                placeholder="https://…"
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
                /teams/{slug || "team-slug"}
              </p>
            </div>
            <button
              onClick={addTeam}
              disabled={loading}
              className="bg-[#f4473b] px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-[#ff5a4f] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {loading ? "Creating…" : "Create team"}
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
