import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import {
  searchAnime,
  getPopularAnime,
  getAnimeByGenre,
  type AnimeMedia,
} from "@/lib/anilist";
import { AnimeCard } from "@/components/AnimeCard";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/browse")({
  component: BrowsePage,
  head: () => ({
    meta: [
      { title: "Browse Anime — BakaBytes" },
      { name: "description", content: "Search and filter anime by genre on BakaBytes." },
    ],
  }),
});

const GENRES = [
  "Action",
  "Romance",
  "Comedy",
  "Fantasy",
  "Horror",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
];

function BrowsePage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [genre, setGenre] = useState<string | null>(null);
  const [results, setResults] = useState<AnimeMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 500);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetcher = debouncedQuery
      ? searchAnime(debouncedQuery)
      : genre
      ? getAnimeByGenre(genre)
      : getPopularAnime();

    fetcher
      .then((data) => {
        if (cancelled) return;
        const filtered = debouncedQuery && genre
          ? data.filter((a) => a.genres?.includes(genre))
          : data;
        setResults(filtered);
      })
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, genre]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="container mx-auto px-4 pt-24 pb-8">
        <h1 className="text-3xl md:text-4xl font-black mb-6">Browse Anime</h1>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime by title..."
            className="w-full rounded-lg bg-card border border-border pl-12 pr-12 py-4 text-lg outline-none focus:border-primary transition-colors"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setGenre(null)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors border ${
              genre === null
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/50"
            }`}
          >
            All
          </button>
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g === genre ? null : g)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors border ${
                genre === g
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/50"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center">No anime found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center">
            {results.map((a) => (
              <AnimeCard key={a.id} anime={a} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
