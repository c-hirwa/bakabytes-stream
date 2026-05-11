import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AnimeCard } from "@/components/AnimeCard";
import { getFavorites, removeFavorite } from "@/lib/storage";
import type { AnimeMedia } from "@/lib/anilist";

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<AnimeMedia[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const handleRemove = (id: number) => {
    removeFavorite(id);
    setFavorites((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-black">Favorites</h1>
          <p className="mt-2 text-muted-foreground">All your saved anime in one place.</p>
        </div>

        {favorites.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-16 text-center">
            <p className="text-xl font-semibold">No favorites yet.</p>
            <p className="mt-3 text-muted-foreground">Browse anime and tap the heart to save your next watch.</p>
            <Link
              to="/browse"
              className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Browse Anime
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.map((anime) => (
              <div key={anime.id} className="group relative rounded-3xl border border-border bg-card overflow-hidden">
                <AnimeCard anime={anime} />
                <button
                  type="button"
                  onClick={() => handleRemove(anime.id)}
                  className="absolute right-4 top-4 rounded-full bg-background/90 px-3 py-2 text-xs font-semibold text-destructive"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
