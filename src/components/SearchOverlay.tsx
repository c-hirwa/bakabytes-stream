import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { searchAnime, type AnimeMedia } from "@/lib/anilist";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AnimeMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const t = setTimeout(() => {
      searchAnime(query)
        .then((r) => !cancelled && setResults(r))
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setLoading(false));
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md overflow-y-auto">
      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Search className="h-6 w-6 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime..."
            className="flex-1 bg-transparent text-2xl md:text-3xl font-medium outline-none placeholder:text-muted-foreground"
          />
          {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-8">
          {!query.trim() ? (
            <p className="text-muted-foreground">Start typing to search across AniList.</p>
          ) : results.length === 0 && !loading ? (
            <p className="text-muted-foreground">No results.</p>
          ) : (
            <ul className="divide-y divide-border">
              {results.slice(0, 12).map((a) => {
                const title = a.title.english ?? a.title.romaji;
                return (
                  <li key={a.id}>
                    <Link
                      to="/anime/$id"
                      params={{ id: String(a.id) }}
                      onClick={onClose}
                      className="flex gap-4 py-3 hover:bg-muted/40 rounded-md transition-colors px-2"
                    >
                      <img
                        src={a.coverImage.large}
                        alt=""
                        className="w-12 h-16 rounded object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {a.genres.slice(0, 3).join(" · ")}
                        </p>
                      </div>
                      {a.averageScore ? (
                        <span className="text-sm text-primary self-center">
                          {(a.averageScore / 10).toFixed(1)}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
