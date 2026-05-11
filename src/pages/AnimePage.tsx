import { useEffect, useMemo, useState } from "react";
import { Bookmark, Play, Star, Tv, Calendar } from "lucide-react";
import { Link, useParams } from "@tanstack/react-router";
import { getAnimeById, type AnimeMediaDetail } from "@/lib/anilist";
import { addFavorite, isFavorite, removeFavorite } from "@/lib/storage";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { AnimeCard } from "@/components/AnimeCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";

function stripHtml(html: string | null) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function AnimePage() {
  const { id } = useParams();
  const [anime, setAnime] = useState<AnimeMediaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAnimeById(Number(id))
      .then((data) => {
        if (!cancelled) {
          setAnime(data);
          setFavorite(isFavorite(data.id));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Load failed.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const handler = () => {
      if (anime) setFavorite(isFavorite(anime.id));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [anime]);

  const title = anime?.title.english ?? anime?.title.romaji ?? "Anime";
  const score = anime?.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const studio = anime?.studios?.nodes?.find((studio) => studio.isAnimationStudio)?.name ?? anime?.studios?.nodes?.[0]?.name;
  const trailerUrl = useMemo(() => {
    if (!anime?.trailer || anime.trailer.site !== "youtube") return null;
    return `https://www.youtube.com/embed/${anime.trailer.id}`;
  }, [anime]);

  const toggleFavorite = () => {
    if (!anime) return;
    if (isFavorite(anime.id)) {
      removeFavorite(anime.id);
      setFavorite(false);
      return;
    }
    addFavorite({
      id: anime.id,
      title: anime.title,
      coverImage: anime.coverImage,
      bannerImage: anime.bannerImage,
      genres: anime.genres,
      averageScore: anime.averageScore,
      episodes: anime.episodes,
      description: anime.description,
      status: anime.status,
      season: anime.season,
      seasonYear: anime.seasonYear,
    });
    setFavorite(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-4 pt-28 pb-16">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Unable to load anime</h1>
          <p className="mt-3 text-muted-foreground">{error ?? "Something went wrong."}</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="relative h-[55vh] w-full overflow-hidden bg-slate-950">
        {anime.bannerImage ? (
          <img src={anime.bannerImage} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/70" />
      </section>

      <main className="container mx-auto px-4 -mt-32 pb-16">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <img
            src={anime.coverImage.extraLarge ?? anime.coverImage.large}
            alt={title}
            className="rounded-3xl border border-border bg-card shadow-2xl"
            loading="lazy"
          />

          <div className="rounded-3xl border border-border bg-card p-8 shadow-2xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary">{anime.status.replaceAll("_", " ")}</p>
                <h1 className="mt-3 text-4xl font-black leading-tight">{title}</h1>
                {anime.title.english && anime.title.romaji !== anime.title.english && (
                  <p className="mt-1 text-muted-foreground">{anime.title.romaji}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={toggleFavorite}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                    favorite ? "bg-primary text-primary-foreground" : "border border-border bg-background text-foreground hover:bg-secondary"
                  }`}
                >
                  <Bookmark className="h-4 w-4" /> {favorite ? "In Favorites" : "Add to Favorites"}
                </button>
                <Link
                  to="/watch/$animeId/$episodeIndex"
                  params={{ animeId: String(anime.id), episodeIndex: "0" }}
                  className="inline-flex items-center gap-2 rounded-full bg-primary/95 px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary"
                >
                  <Play className="h-4 w-4" /> Watch Now
                </Link>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-primary">Score {score}</span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{studio}</span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {anime.episodes ?? "?"} Episodes
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {anime.duration ?? "?"} min each
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{anime.format}</span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {anime.season ?? ""} {anime.seasonYear ?? ""}
              </span>
            </div>

            <div className="mt-8 space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{stripHtml(anime.description)}</p>

              <div className="flex flex-wrap gap-2">
                {anime.genres.map((genre) => (
                  <span key={genre} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary">
                    {genre}
                  </span>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-border bg-background p-6">
                  <h2 className="text-lg font-semibold">Studio</h2>
                  <p className="mt-2 text-muted-foreground">{studio ?? "Unknown"}</p>
                </div>
                <div className="rounded-3xl border border-border bg-background p-6">
                  <h2 className="text-lg font-semibold">Airing Status</h2>
                  <p className="mt-2 text-muted-foreground">{anime.status.replaceAll("_", " ")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-8">
            {trailerUrl && (
              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Trailer</h2>
                    <p className="text-sm text-muted-foreground">Watch the official preview on YouTube.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTrailer((value) => !value)}
                    className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold"
                  >
                    {showTrailer ? "Hide Trailer" : "Watch Trailer"}
                  </button>
                </div>
                {showTrailer && (
                  <div className="mt-6 aspect-video overflow-hidden rounded-3xl bg-black">
                    <iframe
                      src={trailerUrl}
                      title="Trailer"
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            )}

            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="text-xl font-bold">Characters</h2>
              <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                {anime.characters.nodes.length === 0 ? (
                  <div className="text-muted-foreground">No character info available.</div>
                ) : (
                  anime.characters.nodes.map((character) => (
                    <div
                      key={character.name.full}
                      className="min-w-[180px] rounded-3xl border border-border bg-background p-4"
                    >
                      <div className="h-36 w-full overflow-hidden rounded-3xl bg-muted">
                        <img
                          src={character.image.medium}
                          alt={character.name.full}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <h3 className="mt-4 text-base font-semibold">{character.name.full}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">Role</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">Recommendations</h2>
            <div className="mt-4 grid gap-4">
              {anime.recommendations.nodes.length === 0 ? (
                <p className="text-muted-foreground">No recommendations yet.</p>
              ) : (
                anime.recommendations.nodes.map((recommendation) => {
                  const rec = recommendation.mediaRecommendation;
                  if (!rec) return null;
                  return (
                    <Link
                      key={rec.id}
                      to="/anime/$id"
                      params={{ id: String(rec.id) }}
                      className="flex items-center gap-4 rounded-3xl border border-border bg-background p-4 transition hover:border-primary"
                    >
                      <img src={rec.coverImage.large} alt={rec.title.english ?? rec.title.romaji} className="h-20 w-14 rounded-lg object-cover" loading="lazy" />
                      <div className="min-w-0">
                        <p className="font-semibold">{rec.title.english ?? rec.title.romaji}</p>
                        <p className="text-sm text-muted-foreground">Score: {(rec.averageScore / 10).toFixed(1)}</p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
