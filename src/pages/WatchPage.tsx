import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Movie } from "lucide-react";
import { Link, useParams } from "@tanstack/react-router";
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
  const { animeId, episodeIndex } = useParams();
  const epIndex = Number(episodeIndex ?? "0");
  const [anime, setAnime] = useState<AnimeMediaDetail | null>(null);
  const [consumetAnime, setConsumetAnime] = useState<ConsumetAnimeInfo | null>(null);
  const [sources, setSources] = useState<ConsumetSource[]>([]);
  const [searchResults, setSearchResults] = useState<ConsumetSearchResult[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("SUB");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(epIndex);

  const currentEpisode = consumetAnime?.episodes?.[selectedEpisode];
  const animeTitle = anime?.title.english ?? anime?.title.romaji ?? "Anime";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedEpisode(epIndex);

    getAnimeById(Number(animeId))
      .then(async (data) => {
        if (cancelled) return;
        setAnime(data);
        const title = data.title.english ?? data.title.romaji;
        const results = await searchConsumeat(title);
        if (cancelled) return;
        setSearchResults(results);
        const preferredLang = results.find((item) => item.subOrDub.toUpperCase().includes("SUB"))?.subOrDub ?? results[0]?.subOrDub ?? "SUB";
        setSelectedLanguage(preferredLang);
        const selected = results.find((item) => item.subOrDub === preferredLang) ?? results[0];
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
  }, [animeId, epIndex]);

  useEffect(() => {
    if (!currentEpisode) return;
    let cancelled = false;
    setError(null);
    getEpisodeSources(currentEpisode.id)
      .then((sources) => {
        if (!cancelled) return;
        setSources(sources);
        if (anime) {
          addToWatchHistory({
            animeId: Number(animeId),
            animeTitle,
            animeCover: anime.coverImage.large,
            episodeNumber: currentEpisode.number,
            episodeTitle: currentEpisode.title ?? `Episode ${currentEpisode.number}`,
            watchedAt: Date.now(),
            progress: currentEpisode.number,
          });
        }
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
      const result = searchResults.find((item) => item.subOrDub.toUpperCase() === nextLanguage);
      if (!result) throw new Error("Language option unavailable.");
      const info = await getAnimeInfo(result.id);
      setConsumetAnime(info);
      setSelectedEpisode(0);
    } finally {
      setLoading(false);
    }
  };

  const handleEpisodeSelect = (index: number) => {
    setSelectedEpisode(index);
    window.history.pushState({}, "", `/watch/${animeId}/${index}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
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
                onProgress={() => undefined}
              />
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
