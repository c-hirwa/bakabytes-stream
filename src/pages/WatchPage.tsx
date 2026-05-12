import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Movie } from "lucide-react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { getAnimeById, type AnimeMediaDetail } from "@/lib/anilist";
import { searchConsumeat, getAnimeInfo, getEpisodeSources, type ConsumetAnimeInfo, type ConsumetSource, type ConsumetSearchResult } from "@/lib/consumet";
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
  const [consumetAnime, setConsumetAnime] = useState<ConsumetAnimeInfo | null>(null);
  const [sources, setSources] = useState<ConsumetSource[]>([]);
  const [searchResults, setSearchResults] = useState<ConsumetSearchResult[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("SUB");
  const [loading, setLoading] = useState(true);
  const [episodeLoading, setEpisodeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(initialEpisodeIndex);

  const progressRef = useRef(0);

  const currentEpisode = consumetAnime?.episodes?.[selectedEpisode];
  const animeTitle = anime?.title.english ?? anime?.title.romaji ?? "Anime";
  const normalizedAniTitle = useMemo(() => normalizeTitle(anime?.title.english ?? anime?.title.romaji ?? ""), [anime]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedEpisode(initialEpisodeIndex);

    getAnimeById(Number(animeId))
      .then(async (data) => {
        if (cancelled) return;
        setAnime(data);
        const title = data.title.english ?? data.title.romaji;
        const results = await searchConsumeat(title);
        if (cancelled) return;
        setSearchResults(results);
        const preferredLang =
          results.find((item) => String(item.subOrDub).toUpperCase().includes("SUB"))?.subOrDub ??
          results[0]?.subOrDub ??
          "SUB";
        setSelectedLanguage(preferredLang);
        const selected = pickBestConsumetMatch(results, normalizeTitle(title), preferredLang);
        if (!selected) {
          throw new Error("No streaming source found for this anime.");
        }
        const info = await getAnimeInfo(selected.id);
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
    getEpisodeSources(currentEpisode.id)
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

  const availableLanguages = Array.from(new Set(searchResults.map((item) => item.subOrDub.toUpperCase())));
  const handleLanguageToggle = async (nextLanguage: string) => {
    if (nextLanguage === selectedLanguage) return;
    setSelectedLanguage(nextLanguage);
    setLoading(true);
    try {
      const result = pickBestConsumetMatch(searchResults, normalizedAniTitle, nextLanguage);
      if (!result) throw new Error("Language option unavailable.");
      const info = await getAnimeInfo(result.id);
      setConsumetAnime(info);
      setSelectedEpisode(0);
      progressRef.current = 0;
      await navigate({
        to: "/watch/$animeId/$episodeNumber",
        params: { animeId: String(animeId), episodeNumber: "1" },
        replace: true,
      });
    } finally {
      setLoading(false);
    }
  };

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
        episodeNumber: currentEpisode.number,
        episodeTitle: currentEpisode.title ?? `Episode ${currentEpisode.number}`,
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
                <h1 className="mt-2 text-3xl font-bold">{episode.title ?? `Episode ${episode.number}`}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{stripHtml(anime.description)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableLanguages.length > 1 && (
                  <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2">
                    {availableLanguages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleLanguageToggle(lang)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          lang === selectedLanguage
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
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
                Episode {episode.number} of {consumetAnime.episodes.length}
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
              <EpisodeList episodes={consumetAnime.episodes} activeIndex={selectedEpisode} onSelect={handleEpisodeSelect} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function pickBestConsumetMatch(
  results: ConsumetSearchResult[],
  normalizedTargetTitle: string,
  preferredLang?: string,
) {
  if (!results.length) return undefined;
  const lang = preferredLang ? String(preferredLang).toUpperCase() : undefined;

  const candidates = lang
    ? results.filter((r) => String(r.subOrDub).toUpperCase() === lang)
    : results;
  const pool = candidates.length ? candidates : results;

  const exact = pool.find((r) => normalizeTitle(r.title) === normalizedTargetTitle);
  if (exact) return exact;

  const starts = pool.find((r) => normalizeTitle(r.title).startsWith(normalizedTargetTitle));
  if (starts) return starts;

  return pool[0];
}
