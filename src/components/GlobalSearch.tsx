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
          className="fixed inset-0 z-[60] flex items-start justify-center bg-[rgba(2,6,15,0.78)] px-4 pt-[10vh] backdrop-blur-xl"
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
            className="w-full max-w-2xl overflow-hidden rounded-[var(--radius-large)] border border-[var(--border-medium)] bg-[var(--surface)] shadow-[var(--shadow-elevated)]"
          >
            <div className="flex items-center gap-3 border-b border-[var(--border-soft)] px-4">
              <Search
                size={19}
                className="shrink-0 text-[var(--text-muted)]"
              />

              <input
                ref={inputRef}
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                placeholder="Search players, teams, and tournaments"
                className="h-16 flex-1 border-0 bg-transparent px-0 text-base text-[var(--text-primary)] shadow-none outline-none placeholder:text-[var(--text-subtle)] focus:bg-transparent focus:shadow-none"
                aria-label="Search query"
              />

              <button
                type="button"
                onClick={closeSearch}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-white/[0.05] hover:text-[var(--text-primary)]"
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[min(480px,65vh)] overflow-y-auto p-3">
              {!query.trim() ? (
                <div>
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Explore PlayRank
                  </p>

                  <div className="grid gap-1 sm:grid-cols-2">
                    {suggestedLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeSearch}
                        className="rounded-xl px-3 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-white/[0.04] hover:text-[var(--text-primary)]"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {loading ? (
                <div className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">
                  Searching…
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-[rgba(201,75,85,0.24)] bg-[var(--danger-soft)] px-4 py-4 text-sm text-[var(--danger)]">
                  {error}
                </div>
              ) : null}

              {!loading && !error && results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((item) => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={resultHref(item)}
                      onClick={closeSearch}
                      className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition hover:bg-white/[0.045]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {item.name || item.ign || "Unnamed"}
                        </p>

                        <p className="mt-1 text-xs capitalize text-[var(--text-muted)]">
                          {item.type}
                        </p>
                      </div>

                      <span className="text-xs font-medium text-[var(--brand)]">
                        Open
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}

              {!loading &&
              !error &&
              query.trim() &&
              results.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    No results found
                  </p>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Try a different player, team, or tournament name.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border-soft)] px-4 py-3 text-xs text-[var(--text-subtle)]">
              <span>Press Esc to close</span>
              <span>Players · Teams · Tournaments</span>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
