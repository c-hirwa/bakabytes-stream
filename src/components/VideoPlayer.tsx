import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Pause, Play, RefreshCcw, Speaker, Volume2 } from "lucide-react";
import Hls from "hls.js";
import type { ConsumetSource } from "@/lib/consumet";

const QUALITY_ORDER = ["1080p", "720p", "480p", "360p", "default"];

function formatTime(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getPreferredQuality(sources: ConsumetSource[]) {
  const withRank = sources
    .map((s) => ({ ...s, rank: QUALITY_ORDER.indexOf(s.quality) }))
    .sort((a, b) => {
      const ar = a.rank === -1 ? QUALITY_ORDER.length : a.rank;
      const br = b.rank === -1 ? QUALITY_ORDER.length : b.rank;
      return ar - br;
    });
  return withRank[0]?.quality ?? sources[0]?.quality ?? "default";
}

export function VideoPlayer({
  sources,
  animeId,
  episodeNumber,
  onEnded,
  onProgress,
}: {
  sources: ConsumetSource[];
  animeId: string;
  episodeNumber: number;
  onEnded?: () => void;
  onProgress?: (progress: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState("default");
  const [retryKey, setRetryKey] = useState(0);

  const savedTimeKey = `anime_progress_${animeId}_${episodeNumber}`;

  const bestQuality = useMemo(() => getPreferredQuality(sources), [sources]);
  const qualityOptions = useMemo(() => {
    const unique = Array.from(new Set(sources.map((source) => source.quality)));
    return unique.length ? unique : [bestQuality];
  }, [sources, bestQuality]);

  useEffect(() => {
    setSelectedQuality(bestQuality);
  }, [bestQuality]);

  const source = useMemo(() => {
    const selected = sources.find((source) => source.quality === selectedQuality) ??
      sources.find((source) => source.quality === bestQuality) ?? sources[0];
    return selected;
  }, [selectedQuality, sources, bestQuality]);

  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(savedTimeKey) : null;
    const startTime = saved ? Number(saved) : 0;

    setLoading(true);
    setError(null);

    if (!source?.url) {
      setError("No stream available.");
      setLoading(false);
      return;
    }

    // Cleanup any previous HLS instance / source
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    video.removeAttribute("src");
    video.load();

    const attachNative = () => {
      video.src = source.url;
      video.crossOrigin = "anonymous";
      video.load();
      const handleLoaded = () => {
        if (startTime > 0) video.currentTime = Math.min(startTime, video.duration || startTime);
        setLoading(false);
      };
      video.addEventListener("loadedmetadata", handleLoaded);
      return () => {
        video.removeEventListener("loadedmetadata", handleLoaded);
      };
    };

    if (source.isM3U8 && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(source.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (startTime > 0) video.currentTime = Math.min(startTime, video.duration || startTime);
        setLoading(false);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data) return;
        if (data.fatal) {
          // Try standard recovery strategies before surfacing the error
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            try {
              hls.startLoad();
              return;
            } catch {
              // fallthrough
            }
          }
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            try {
              hls.recoverMediaError();
              return;
            } catch {
              // fallthrough
            }
          }
          setError(data?.details ?? "Playback failed.");
          setLoading(false);
        }
      });
    } else {
      attachNative();
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [source, retryKey, savedTimeKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (duration) {
        const progress = video.currentTime / duration;
        onProgress?.(Number(progress.toFixed(4)));
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(savedTimeKey, String(video.currentTime));
      }
    };

    const handleDurationChange = () => {
      setDuration(video.duration || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", () => {
      setIsPlaying(false);
      onEnded?.();
    });

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [duration, onEnded, onProgress, savedTimeKey]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = volume;
  }, [volume]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleRetry = () => {
    setError(null);
    setRetryKey((value) => value + 1);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-border bg-black">
      <div className="relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          className="h-full w-full bg-black object-contain"
          controls={false}
          playsInline
          muted={false}
        />
        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-black/70 text-white">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <span>Loading stream…</span>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 grid place-items-center bg-black/80 text-center px-6 text-white">
            <p className="mb-4 text-lg font-semibold">Unable to play this stream.</p>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              <RefreshCcw className="h-4 w-4" /> Retry
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 bg-slate-950/90 p-4 text-sm text-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={togglePlayback}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {isPlaying ? "Pause" : "Play"}
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-2">
              <Volume2 className="h-4 w-4" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-border accent-primary"
              />
            </div>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center justify-center rounded-full bg-muted p-2 text-foreground"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (videoRef.current) {
                videoRef.current.currentTime = value;
              }
              setCurrentTime(value);
            }}
            className="flex-1 cursor-pointer appearance-none rounded-full bg-border accent-primary"
          />
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2">
            <Speaker className="h-4 w-4" />
            <span>{source?.quality ?? "Auto"}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-muted-foreground">Quality</label>
            <select
              value={selectedQuality}
              onChange={(event) => setSelectedQuality(event.target.value)}
              className="rounded-full border border-border bg-background px-3 py-2 text-sm outline-none"
            >
              {qualityOptions.map((quality) => (
                <option key={quality} value={quality}>
                  {quality}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
