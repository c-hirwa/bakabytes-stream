import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroBanner } from "@/components/HeroBanner";
import { AnimeRow } from "@/components/AnimeRow";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { getTrendingAnime, getPopularAnime, getSeasonalAnime, getAnimeByGenre, type AnimeMedia } from "@/lib/anilist";
import { getWatchHistory } from "@/lib/storage";

export function HomePage() {
  const [trending, setTrending] = useState<AnimeMedia[]>([]);
  const [popular, setPopular] = useState<AnimeMedia[]>([]);
  const [seasonal, setSeasonal] = useState<AnimeMedia[]>([]);
  const [action, setAction] = useState<AnimeMedia[]>([]);
  const [romance, setRomance] = useState<AnimeMedia[]>([]);
  const [continueWatching, setContinueWatching] = useState<AnimeMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [t, p, s, a, r] = await Promise.all([
          getTrendingAnime(),
          getPopularAnime(),
          getSeasonalAnime(),
          getAnimeByGenre("Action"),
          getAnimeByGenre("Romance"),
        ]);
        if (cancelled) return;
        setTrending(t);
        setPopular(p);
        setSeasonal(s);
        setAction(a);
        setRomance(r);
        const history = getWatchHistory().slice(0, 8);
        setContinueWatching(
          history.map((item) => ({
            id: item.animeId,
            title: { romaji: item.animeTitle, english: item.animeTitle },
            coverImage: {
              large: item.animeCover,
              extraLarge: item.animeCover,
            },
            bannerImage: null,
            genres: [],
            averageScore: 0,
            episodes: 0,
            description: null,
            status: "",
            season: null,
            seasonYear: null,
          })),
        );
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      {loading ? (
        <div className="pt-24">
          <div className="container mx-auto px-4 py-8">
            <div className="space-y-6">
              <div className="rounded-3xl bg-card p-10">
                <LoadingSpinner />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl bg-card p-10">
                  <LoadingSpinner />
                </div>
                <div className="rounded-3xl bg-card p-10">
                  <LoadingSpinner />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <main className="pt-24">
          <HeroBanner items={trending.slice(0, 5)} />
          <div className="-mt-24 relative z-10 space-y-8 px-0 pb-16">
            <AnimeRow title="Trending Now" items={trending} />
            <AnimeRow title="Popular All Time" items={popular} />
            <AnimeRow title="This Season" items={seasonal} />
            <AnimeRow title="Action Anime" items={action} />
            <AnimeRow title="Romance Anime" items={romance} />
            {continueWatching.length > 0 && <AnimeRow title="Continue Watching" items={continueWatching} />}
          </div>
        </main>
      )}
      <Footer />
    </div>
  );
}
