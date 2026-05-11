import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, ArrowLeft } from "lucide-react";
import { getAnimeById, type AnimeMediaDetail, type StreamingEpisode } from "@/lib/anilist";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/watch/$animeId/$episodeIndex")({
  component: WatchPage,
  head: ({ params }) => ({
    meta: [{ title: `Watch — Episode ${Number(params.episodeIndex) + 1}` }],
  }),
});

function stripHtml(html: string | null) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

function getYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const pathMatch = u.pathname.match(/\/embed\/([^/?]+)/);
      if (pathMatch) return `https://www.youtube.com/embed/${pathMatch[1]}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
  } catch {
    return null;
  }
  return null;
}

function WatchPage() {
  const { animeId, episodeIndex } = Route.useParams();
  const epIdx = Number(episodeIndex);
  const [anime, setAnime] = useState<AnimeMediaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAnimeById(Number(animeId))
      .then((d) => !cancelled && setAnime(d))
      .catch((e: unknown) =>
        !cancelled && setError(e instanceof Error ? e.message : "Failed to load"),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [animeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-4 py-6 grid lg:grid-cols-[1fr_320px] gap-6">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Couldn't load episode</h1>
          <p className="mt-2 text-muted-foreground">{error ?? "Unknown error"}</p>
          <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  const episodes: StreamingEpisode[] = anime.streamingEpisodes ?? [];
  const episode = episodes[epIdx];
  const animeTitle = anime.title.english ?? anime.title.romaji;
  const hasPrev = epIdx > 0;
  const hasNext = epIdx < episodes.length - 1;
  const youtubeEmbed = episode ? getYouTubeEmbed(episode.url) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <Link
          to="/anime/$id"
          params={{ id: animeId }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4" /> Back to {animeTitle}
        </Link>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* Main */}
          <div>
            {/* Player */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black border border-border">
              {!episode ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Episode not available
                </div>
              ) : youtubeEmbed ? (
                <iframe
                  src={youtubeEmbed}
                  title={episode.title || `Episode ${epIdx + 1}`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div
                  className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center bg-cover bg-center"
                  style={episode.thumbnail ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.85)), url(${episode.thumbnail})` } : undefined}
                >
                  <p className="text-muted-foreground">This episode streams on {episode.site}.</p>
                  <Button asChild size="lg">
                    <a href={episode.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" /> Watch on {episode.site}
                    </a>
                  </Button>
                </div>
              )}
            </div>

            {/* Nav */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button variant="outline" disabled={!hasPrev} asChild={hasPrev}>
                {hasPrev ? (
                  <Link
                    to="/watch/$animeId/$episodeIndex"
                    params={{ animeId, episodeIndex: String(epIdx - 1) }}
                  >
                    <ChevronLeft /> Previous
                  </Link>
                ) : (
                  <span><ChevronLeft /> Previous</span>
                )}
              </Button>
              <span className="text-sm text-muted-foreground">
                Episode {epIdx + 1} of {episodes.length}
              </span>
              <Button variant="outline" disabled={!hasNext} asChild={hasNext}>
                {hasNext ? (
                  <Link
                    to="/watch/$animeId/$episodeIndex"
                    params={{ animeId, episodeIndex: String(epIdx + 1) }}
                  >
                    Next <ChevronRight />
                  </Link>
                ) : (
                  <span>Next <ChevronRight /></span>
                )}
              </Button>
            </div>

            {/* Info */}
            <div className="mt-6">
              <p className="text-sm uppercase tracking-widest text-primary">{animeTitle}</p>
              <h1 className="mt-1 text-2xl md:text-3xl font-black">
                {episode?.title || `Episode ${epIdx + 1}`}
              </h1>
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-3xl">
                {stripHtml(anime.description)}
              </p>
            </div>
          </div>

          {/* Episode list */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <h2 className="text-lg font-bold mb-3">Episodes</h2>
            <div className="rounded-lg border border-border bg-card max-h-[70vh] overflow-y-auto">
              {episodes.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No episodes available.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {episodes.map((ep, idx) => {
                    const active = idx === epIdx;
                    return (
                      <li key={`${ep.url}-${idx}`}>
                        <Link
                          to="/watch/$animeId/$episodeIndex"
                          params={{ animeId, episodeIndex: String(idx) }}
                          className={`flex gap-3 p-3 hover:bg-muted/50 transition-colors ${active ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
                        >
                          <div className="relative w-24 aspect-video flex-shrink-0 overflow-hidden rounded bg-muted">
                            {ep.thumbnail && (
                              <img src={ep.thumbnail} alt="" className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">Ep {idx + 1}</p>
                            <p className="text-sm font-medium line-clamp-2">{ep.title || `Episode ${idx + 1}`}</p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
