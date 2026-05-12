import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Movie } from "lucide-react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { getAnimeById, type AnimeMediaDetail } from "@/lib/anilist";
import { getAnilistEpisodeSources, getAnilistMetaInfo, type ConsumetMetaAnimeInfo, type ConsumetSource } from "@/lib/consumet";
import { addToWatchHistory } from "@/lib/storage";
import { Navbar } from "@/components/Navbar";
import { VideoPlayer } from "@/components/VideoPlayer";
import { EpisodeList } from "@/components/EpisodeList";
import { LoadingSpinner } from "@/components/LoadingSpinner";

function stripHtml(html: string | null) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function WatchPage() {
  const params = useParams({ strict: false }) as { animeId?: string; episodeIndex?: string; episodeNumber?: string };
  const navigate = useNavigate({ from: "/watch/$animeId/$episodeNumber" as any });

  const animeId = params.animeId ?? "";
  // New route is 1-based episodeNumber. Old route is 0-based episodeIndex.
  const routeEpisodeNumber = params.episodeNumber != null ? Number(params.episodeNumber) : undefined;
  const legacyEpisodeIndex = params.episodeIndex != null ? Number(params.episodeIndex) : undefined;
  const initialEpisodeIndex = Number.isFinite(routeEpisodeNumber)
    ? Math.max(0, Number(routeEpisodeNumber) - 1)
    : Number.isFinite(legacyEpisodeIndex)
      ? Math.max(0, Number(legacyEpisodeIndex))
      : 0;

  // If user hits the legacy route, normalize URL to new 1-based route.
  useEffect(() => {
    if (!animeId) return;
    if (params.episodeNumber != null) return;
    const nextEpisodeNumber = String(initialEpisodeIndex + 1);
    void navigate({
      to: "/watch/$animeId/$episodeNumber",
      params: { animeId: String(animeId), episodeNumber: nextEpisodeNumber },
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeId]);

  const [anime, setAnime] = useState<AnimeMediaDetail | null>(null);
  const [consumetAnime, setConsumetAnime] = useState<ConsumetMetaAnimeInfo | null>(null);
  const [sources, setSources] = useState<ConsumetSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [episodeLoading, setEpisodeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(initialEpisodeIndex);

  const progressRef = useRef(0);

  const currentEpisode = consumetAnime?.episodes?.[selectedEpisode];
  const animeTitle = anime?.title.english ?? anime?.title.romaji ?? "Anime";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedEpisode(initialEpisodeIndex);

    getAnimeById(Number(animeId))
      .then(async (data) => {
        if (cancelled) return;
        setAnime(data);
        // Primary mapping: Consumet meta/anilist with provider=zoro.
        const info = await getAnilistMetaInfo(Number(animeId), "zoro");
        if (cancelled) return;
        setConsumetAnime(info);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load stream.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [animeId, initialEpisodeIndex]);

  useEffect(() => {
    if (!currentEpisode) return;
    let cancelled = false;
    setEpisodeLoading(true);
    setError(null);
    getAnilistEpisodeSources(currentEpisode.id)
      .then((sources) => {
        if (cancelled) return;
        setSources(sources);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load episode source.");
      })
      .finally(() => {
        if (!cancelled) setEpisodeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentEpisode, anime, animeId, animeTitle]);

  const handleEpisodeSelect = (index: number) => {
    setSelectedEpisode(index);
    progressRef.current = 0;
    void navigate({
      to: "/watch/$animeId/$episodeNumber",
      params: { animeId: String(animeId), episodeNumber: String(index + 1) },
      replace: false,
    });
  };

  const handleNext = () => {
    if (consumetAnime && selectedEpisode < consumetAnime.episodes.length - 1) {
      handleEpisodeSelect(selectedEpisode + 1);
    }
  };

  const handlePrev = () => {
    if (selectedEpisode > 0) {
      handleEpisodeSelect(selectedEpisode - 1);
    }
  };

  const handlePlayerProgress = useCallback(
    (progress: number) => {
      if (!anime || !currentEpisode) return;
      // Throttle writes: only update when progress moves meaningfully
      if (Math.abs(progress - progressRef.current) < 0.02 && progress !== 0) return;
      progressRef.current = progress;
      addToWatchHistory({
        animeId: Number(animeId),
        animeTitle,
        animeCover: anime.coverImage.large,
        episodeNumber: currentEpisode.episode,
        episodeTitle: currentEpisode.title ?? `Episode ${currentEpisode.episode}`,
        watchedAt: Date.now(),
        progress,
      });
    },
    [anime, animeId, animeTitle, currentEpisode],
  );

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

  if (error || !anime || !consumetAnime) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="rounded-3xl border border-border bg-card p-8 text-center">
            <p className="text-xl font-semibold">{error ?? "Unable to load this episode."}</p>
            <Link
              to="/anime/$id"
              params={{ id: animeId }}
              className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Back to anime page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const episode = currentEpisode ?? consumetAnime.episodes[0];
  const hasPrev = selectedEpisode > 0;
  const hasNext = selectedEpisode < consumetAnime.episodes.length - 1;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <div className="grid gap-8 xl:grid-cols-[3fr_1fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-4 lg:p-6">
              <VideoPlayer
                sources={sources}
                animeId={animeId}
                episodeNumber={selectedEpisode + 1}
                onEnded={handleNext}
                onProgress={handlePlayerProgress}
              />
              {episodeLoading && (
                <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                  Loading episode sources…
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-primary">{animeTitle}</p>
                <h1 className="mt-2 text-3xl font-bold">{episode.title ?? `Episode ${episode.episode}`}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{stripHtml(anime.description)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={!hasPrev}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!hasNext}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Link
                to="/anime/$id"
                params={{ id: animeId }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" /> Back to anime page
              </Link>
              <span>
                Episode {episode.episode} of {consumetAnime.episodes.length}
              </span>
              <span>{anime.status.replaceAll("_", " ")}</span>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <Movie className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Episode List</h2>
              </div>
              <EpisodeList
                episodes={consumetAnime.episodes.map((ep) => ({
                  id: ep.id,
                  number: ep.episode,
                  url: "",
                  title: ep.title ?? `Episode ${ep.episode}`,
                }))}
                activeIndex={selectedEpisode}
                onSelect={handleEpisodeSelect}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
