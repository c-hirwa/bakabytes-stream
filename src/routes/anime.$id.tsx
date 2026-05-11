import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bookmark, Star, Tv, Calendar, Play } from "lucide-react";
import { getAnimeById, type AnimeMediaDetail } from "@/lib/anilist";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/anime/$id")({
  component: AnimePage,
  head: ({ params }) => ({
    meta: [{ title: `Anime #${params.id} — BakaBytes` }],
  }),
});

function stripHtml(html: string | null) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

function AnimePage() {
  const { id } = Route.useParams();
  const [anime, setAnime] = useState<AnimeMediaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAnimeById(Number(id))
      .then((data) => {
        if (!cancelled) setAnime(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <Skeleton className="h-[50vh] w-full rounded-none" />
        <div className="container mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Couldn't load this anime</h1>
          <p className="mt-2 text-muted-foreground">{error ?? "Unknown error"}</p>
          <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  const title = anime.title.english ?? anime.title.romaji;
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const studio = anime.studios?.nodes?.find((s) => s.isAnimationStudio)?.name
    ?? anime.studios?.nodes?.[0]?.name;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Banner */}
      <div className="relative h-[55vh] w-full overflow-hidden">
        {anime.bannerImage ? (
          <img src={anime.bannerImage} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-background to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
      </div>

      {/* Details */}
      <section className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          <img
            src={anime.coverImage.extraLarge ?? anime.coverImage.large}
            alt={title}
            className="w-48 md:w-64 rounded-lg shadow-2xl border border-border self-start"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-5xl font-black">{title}</h1>
                {anime.title.english && anime.title.romaji !== anime.title.english && (
                  <p className="mt-1 text-muted-foreground">{anime.title.romaji}</p>
                )}
              </div>
              <Button
                variant={bookmarked ? "default" : "outline"}
                size="icon"
                onClick={() => setBookmarked((b) => !b)}
                aria-label="Add to My List"
              >
                <Bookmark className={bookmarked ? "fill-current" : ""} />
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              {score && (
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-1 text-primary">
                  <Star className="size-4 fill-current" /> {score}
                </span>
              )}
              {anime.episodes && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Tv className="size-4" /> {anime.episodes} eps
                </span>
              )}
              {(anime.season || anime.seasonYear) && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Calendar className="size-4" />
                  {anime.season ?? ""} {anime.seasonYear ?? ""}
                </span>
              )}
              <Badge variant="secondary">{anime.status.replaceAll("_", " ")}</Badge>
              {studio && <span className="text-muted-foreground">{studio}</span>}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {anime.genres.map((g) => (
                <Badge key={g} variant="outline" className="border-primary/40 text-foreground">
                  {g}
                </Badge>
              ))}
            </div>

            <p className="mt-6 max-w-3xl text-muted-foreground leading-relaxed">
              {stripHtml(anime.description)}
            </p>
          </div>
        </div>

        {/* Episodes */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Episodes</h2>
          {anime.streamingEpisodes && anime.streamingEpisodes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {anime.streamingEpisodes.map((ep, idx) => (
                <Link
                  key={`${ep.url}-${idx}`}
                  to="/watch/$animeId/$episodeIndex"
                  params={{ animeId: String(anime.id), episodeIndex: String(idx) }}
                  className="group rounded-lg overflow-hidden border border-border bg-card hover:border-primary transition-colors"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {ep.thumbnail && (
                      <img src={ep.thumbnail} alt={ep.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="size-10 text-white fill-current" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium line-clamp-2">{ep.title || `Episode ${idx + 1}`}</p>
                    <p className="text-xs text-muted-foreground mt-1">{ep.site}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No streaming episodes available.</p>
          )}
        </div>
      </section>

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
}
