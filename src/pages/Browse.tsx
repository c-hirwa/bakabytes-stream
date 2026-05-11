import { useEffect, useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { AnimeCard } from "@/components/AnimeCard";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { GenreFilter } from "@/components/GenreFilter";
import { getAnimeByGenrePage, searchAnimePage, type AnimeMedia } from "@/lib/anilist";

const GENRES = [
  "All",
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mecha",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];

const FORMATS = ["All", "TV", "Movie", "OVA", "ONA", "Special"];
const STATUS = ["All", "RELEASING", "FINISHED", "NOT_YET_RELEASED"];
const SORT_OPTIONS = [
  { label: "Popularity", value: "POPULARITY_DESC" },
  { label: "Score", value: "SCORE_DESC" },
  { label: "Trending", value: "TRENDING_DESC" },
  { label: "Newest", value: "START_DATE_DESC" },
];

export function BrowsePage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [format, setFormat] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("POPULARITY_DESC");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<AnimeMedia[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const selectedGenre = genre === "All" ? undefined : genre;
    const selectedFormat = format === "All" ? undefined : format;
    const selectedStatus = status === "All" ? undefined : status;

    const fetcher = debouncedQuery
      ? searchAnimePage(debouncedQuery, page, 24, sort, selectedFormat, selectedStatus)
      : selectedGenre
      ? getAnimeByGenrePage(selectedGenre, page, 24, sort, selectedFormat, selectedStatus)
      : searchAnimePage("", page, 24, sort, selectedFormat, selectedStatus);

    fetcher
      .then((data) => {
        if (cancelled) return;
        setResults((prev) => (page === 1 ? data.items : [...prev, ...data.items]));
        setTotal(data.pageInfo.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load anime.");
        setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, genre, format, status, sort, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, genre, format, status, sort]);

  const loadMoreDisabled = results.length >= total;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-black">Browse Anime</h1>
          <p className="mt-2 text-muted-foreground">Discover anime by search, genre, format, status, and popularity.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search anime by title..."
              className="w-full rounded-3xl border border-border bg-card px-12 py-4 text-base outline-none focus:border-primary transition"
            />
            {loading && <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-primary" />}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <GenreFilter options={GENRES} value={genre} onChange={setGenre} />
            <div className="rounded-3xl border border-border bg-card p-3">
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Format</label>
              <select
                value={format}
                onChange={(event) => setFormat(event.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none"
              >
                {FORMATS.map((formatOption) => (
                  <option key={formatOption} value={formatOption}>
                    {formatOption}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-3xl border border-border bg-card p-3">
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none"
              >
                {STATUS.map((statusOption) => (
                  <option key={statusOption} value={statusOption}>
                    {statusOption}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSort(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  sort === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground border border-border hover:bg-secondary hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{total.toLocaleString()} results</span>
            {error && <span className="text-destructive">{error}</span>}
          </div>
        </div>

        <section className="mt-8">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="aspect-[2/3] rounded-3xl bg-card" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-12 text-center text-muted-foreground">
              No anime matched your filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {results.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          )}
        </section>

        {!loading && results.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              disabled={loadMoreDisabled}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadMoreDisabled ? "No more results" : "Load More"}
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
