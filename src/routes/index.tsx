import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { AnimeRow } from "@/components/AnimeRow";
import { Footer } from "@/components/Footer";
import { AnimeRowSkeleton, HeroSkeleton } from "@/components/Skeletons";
import { getTrendingAnime, getPopularAnime, type AnimeMedia } from "@/lib/anilist";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "BakaBytes — Stream Anime Without Limits" },
      {
        name: "description",
        content:
          "BakaBytes is your home for streaming the best anime — trending series, seasonal hits, and timeless classics in one dark, immersive player.",
      },
    ],
  }),
});

function Index() {
  const [trendingAnime, setTrendingAnime] = useState<AnimeMedia[]>([]);
  const [popularAnime, setPopularAnime] = useState<AnimeMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [t, p] = await Promise.all([getTrendingAnime(), getPopularAnime()]);
        if (cancelled) return;
        setTrendingAnime(t);
        setPopularAnime(p);
      } catch (err) {
        console.error("Failed to fetch anime:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = trendingAnime.find((a) => a.bannerImage) ?? trendingAnime[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        {loading ? <HeroSkeleton /> : <Hero featured={featured} />}
        <div className="-mt-20 relative z-10">
          {loading ? (
            <>
              <AnimeRowSkeleton title="Trending Now" />
              <AnimeRowSkeleton title="Popular This Season" />
            </>
          ) : (
            <>
              <AnimeRow title="Trending Now" items={trendingAnime} />
              <AnimeRow title="Popular This Season" items={popularAnime} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
