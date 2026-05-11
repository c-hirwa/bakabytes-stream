import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { AnimeRow } from "@/components/AnimeRow";
import { Footer } from "@/components/Footer";
import type { Anime } from "@/components/AnimeCard";
import { getTrendingAnime, getPopularAnime, type AnimeMedia } from "@/lib/anilist";

import a1 from "@/assets/anime-1.jpg";
import a2 from "@/assets/anime-2.jpg";
import a3 from "@/assets/anime-3.jpg";
import a4 from "@/assets/anime-4.jpg";
import a5 from "@/assets/anime-5.jpg";
import a6 from "@/assets/anime-6.jpg";
import a7 from "@/assets/anime-7.jpg";
import a8 from "@/assets/anime-8.jpg";

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

const trending: Anime[] = [
  { title: "Sakura's Edge", image: a1, episodes: 12, score: 9.1 },
  { title: "Iron Vanguard", image: a2, episodes: 24, score: 8.7 },
  { title: "Starlit Reverie", image: a3, episodes: 13, score: 8.4 },
  { title: "Inferno's Heir", image: a4, episodes: 26, score: 9.3 },
  { title: "Neon Cipher", image: a5, episodes: 12, score: 8.9 },
  { title: "Shadow of the Moon", image: a6, episodes: 22, score: 8.6 },
  { title: "Stormcaller", image: a7, episodes: 18, score: 9.0 },
  { title: "After School Specter", image: a8, episodes: 12, score: 8.2 },
];

const popular: Anime[] = [
  { title: "Inferno's Heir", image: a4, episodes: 26, score: 9.3 },
  { title: "Stormcaller", image: a7, episodes: 18, score: 9.0 },
  { title: "Sakura's Edge", image: a1, episodes: 12, score: 9.1 },
  { title: "Neon Cipher", image: a5, episodes: 12, score: 8.9 },
  { title: "Shadow of the Moon", image: a6, episodes: 22, score: 8.6 },
  { title: "Iron Vanguard", image: a2, episodes: 24, score: 8.7 },
  { title: "After School Specter", image: a8, episodes: 12, score: 8.2 },
  { title: "Starlit Reverie", image: a3, episodes: 13, score: 8.4 },
];

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
        console.log("Trending anime:", t);
        console.log("Popular anime:", p);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Suppress unused warnings until UI is wired to API data
  void trendingAnime;
  void popularAnime;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <div className="-mt-20 relative z-10">
          <AnimeRow title="Trending Now" items={trending} />
          <AnimeRow title="Popular This Season" items={popular} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
