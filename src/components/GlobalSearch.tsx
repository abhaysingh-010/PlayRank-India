"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Result = {id: string;name?: string;ign?: string;slug: string;type: "player" | "team" | "tournament";};

export default function GlobalSearch()
{

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);

  // Ctrl + K
  useEffect(() => 
  {
    function onKeyDown(e: KeyboardEvent) 
    {if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") 
      {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);return () => window.removeEventListener("keydown", onKeyDown);
  }, 
  []);

  // search API
  useEffect(() => 
  {
    async function search()
    {
      if (!query.trim()) 
      {
        setResults([]);
        return;
      }
      const res = await fetch(`/api/search?q=${query}`);
      const data = await res.json();setResults(data || []);
    }

    const t = setTimeout(search, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <>
      {/* Trigger */}
      <div onClick={() => setOpen(true)} className="w-full cursor-pointer">
        <div className="w-full rounded-xl border border-white/20 bg-zinc-900 px-4 py-2 text-zinc-400">
          Search players, teams, tournaments...
        </div>
      </div>

      {/* Modal */}
      {open && 
        (
          <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-start justify-center pt-28 px-6">
            <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden">

              {/* input */}
              <div className="border-b border-white/10 p-4">
                <input value={query ?? ""}onChange={(e) => setQuery(e.target.value)}/>
              </div>
              {/* results */}
              <div className="max-h-[400px] overflow-y-auto">
                {results.map
                  (
                    (item) => 
                    (
                      <Link key={`${item.type}-${item.id}`} href={ item.type === "team" ? `/teams/${item.slug}` : item.type === "player" ? `/players/${item.slug}` : `/tournaments/${item.slug}`} onClick={() => setOpen(false)} className="block p-4 hover:bg-white/5">
                        <div className="text-white">
                          {item.name || item.ign}
                        </div>
                        <div className="text-xs text-zinc-500 capitalize">
                          {item.type}
                        </div>
                      </Link>
                    )
                  )
                }
                {query && results.length === 0 && 
                  (
                    <div className="p-4 text-zinc-500">
                      No results found
                    </div>
                  )
                }
              </div>

              {/* close */}
              <button onClick={() => setOpen(false)}className="w-full border-t border-white/10 py-3 text-zinc-400 hover:text-white">
                Close
              </button>
            </div>
          </div>
        )
      }
    </>
  );
}