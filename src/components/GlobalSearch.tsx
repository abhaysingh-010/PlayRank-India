"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Result = {
  id: string;
  name?: string;
  ign?: string;
  slug: string;
  type: "player" | "team" | "tournament";
};

type GlobalSearchProps = {
  forceOpen?: boolean;
  onRequestClose?: () => void;
};

const suggestedLinks = [
  { label: "Rankings", href: "/rankings" },
  { label: "Teams", href: "/teams" },
  { label: "Players", href: "/players" },
  { label: "Matches", href: "/matches" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Compare", href: "/compare" },
];

function resultHref(item: Result) {
  if (item.type === "team") return `/teams/${item.slug}`;
  if (item.type === "player") return `/players/${item.slug}`;
  return `/tournaments/${item.slug}`;
}

export default function GlobalSearch({
  forceOpen = false,
  onRequestClose,
}: GlobalSearchProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const open = forceOpen || internalOpen;

  const openSearch = useCallback(() => {
    setInternalOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setInternalOpen(false);
    setQuery("");
    setResults([]);
    setLoading(false);
    setError("");
    onRequestClose?.();
  }, [onRequestClose]);

  function handleQueryChange(value: string) {
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      setLoading(false);
      setError("");
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        openSearch();
      }

      if (event.key === "Escape" && open) {
        closeSearch();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeSearch, open, openSearch]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) return;

    const controller = new AbortController();

    async function search() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmedQuery)}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Search request failed.");
        }

        const data = (await response.json()) as Result[];
        setResults(Array.isArray(data) ? data : []);
      } catch (searchError) {
        if (
          searchError instanceof DOMException &&
          searchError.name === "AbortError"
        ) {
          return;
        }

        setResults([]);
        setError("Search is temporarily unavailable.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    const timeout = window.setTimeout(search, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  return (
    <>
      {!forceOpen ? (
        <button
          type="button"
          onClick={openSearch}
          className="flex h-10 w-full min-w-0 items-center justify-between gap-4 rounded-xl border border-[var(--border-soft)] bg-white/[0.025] px-3.5 text-left transition hover:border-[var(--border-medium)] hover:bg-white/[0.04] sm:min-w-[280px]"
          aria-label="Search PlayRank"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <Search
              size={16}
              className="shrink-0 text-[var(--text-muted)]"
            />

            <span className="truncate text-sm text-[var(--text-muted)]">
              Search PlayRank
            </span>
          </span>

          <span className="rounded-md border border-[var(--border-soft)] bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-[var(--text-subtle)]">
            Ctrl K
          </span>
        </button>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 px-3 pt-3 backdrop-blur-xl sm:px-5 sm:pt-[10vh]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSearch();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Search PlayRank"
            className="w-full max-w-[900px] overflow-hidden border border-white/15 bg-[#0a0a0a]/95 shadow-[0_30px_120px_rgba(0,0,0,.7)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <p className="text-[9px] font-black uppercase tracking-[.22em] text-white/30">
                Search PlayRank
              </p>
              <button
                type="button"
                onClick={closeSearch}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-white/35 transition hover:bg-white/[0.05] hover:text-white"
                aria-label="Close search"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-4 border-b border-white/15 px-5">
              <Search
                size={20}
                className="shrink-0 text-[#f4473b]"
              />

              <input
                ref={inputRef}
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                placeholder="Player, team or tournament…"
                className="h-[72px] min-w-0 flex-1 !border-0 !bg-transparent px-0 text-lg font-medium text-white !shadow-none !outline-none placeholder:text-white/20 focus:!border-0 focus:!bg-transparent focus:!shadow-none"
                aria-label="Search query"
              />
            </div>

            <div className="max-h-[min(430px,65vh)] overflow-y-auto">
              {!query.trim() ? (
                <div className="p-5">
                  <p className="mb-3 text-[9px] font-black uppercase tracking-[.2em] text-white/25">
                    Quick access
                  </p>

                  <div className="grid border-l border-t border-white/10 sm:grid-cols-2">
                    {suggestedLinks.map((item, index) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeSearch}
                        className="group flex items-center justify-between border-b border-r border-white/10 px-4 py-3.5 text-sm font-semibold text-white/55 transition hover:bg-white/[0.04] hover:text-white"
                      >
                        <span>{item.label}</span>
                        <span className="font-mono text-[9px] text-white/15 transition group-hover:text-[#f4473b]">
                          0{index + 1}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {loading ? (
                <div className="px-5 py-12 text-center text-sm text-white/35">
                  Searching…
                </div>
              ) : null}

              {error ? (
                <div className="m-5 border border-red-400/25 bg-red-400/10 px-4 py-4 text-sm text-red-300">
                  {error}
                </div>
              ) : null}

              {!loading && !error && results.length > 0 ? (
                <div>
                  {results.map((item) => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={resultHref(item)}
                      onClick={closeSearch}
                      className="group flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 transition hover:bg-white/[0.04]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {item.name || item.ign || "Unnamed"}
                        </p>

                        <p className="mt-1 text-[9px] font-bold uppercase tracking-[.15em] text-white/25">
                          {item.type}
                        </p>
                      </div>

                      <span className="text-sm text-white/20 transition group-hover:translate-x-1 group-hover:text-[#f4473b]">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}

              {!loading &&
              !error &&
              query.trim() &&
              results.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm font-medium text-white/60">
                    No results found
                  </p>

                  <p className="mt-2 text-xs text-white/25">
                    Try a different player, team, or tournament name.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-[9px] uppercase tracking-[.14em] text-white/20">
              <span>Esc to close</span>
              <span>Live records</span>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
