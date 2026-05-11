import { useEffect, useMemo, useState } from "react";
import { Play, Info } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { AnimeMedia } from "@/lib/anilist";

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function HeroBanner({ items }: { items: AnimeMedia[] }) {
  const slidable = useMemo(
    () => items.filter((item) => item.bannerImage || item.coverImage.large || item.coverImage.extraLarge),
    [items],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!slidable.length) return;
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slidable.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [slidable.length]);

  const active = slidable[activeIndex] ?? items[0];
  const title = active?.title.english ?? active?.title.romaji ?? "Featured Anime";
  const description = truncate(active?.description?.replace(/<[^>]*>/g, "") ?? "", 180);
  const score = active?.averageScore ? (active.averageScore / 10).toFixed(1) : "TBD";
  const banner = active?.bannerImage || active?.coverImage?.extraLarge || active?.coverImage?.large;

  return (
    <section className="relative h-[85vh] min-h-[550px] w-full overflow-hidden rounded-b-[3rem] bg-black">
      <img src={banner} alt={title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/10 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/70" />

      <div className="relative z-10 flex h-full flex-col justify-end pb-24 px-4 md:px-16">
        <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Stream Now
        </span>
        <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-foreground md:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/watch/$animeId/$episodeIndex"
            params={{ animeId: String(active?.id ?? 0), episodeIndex: "0" }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <Play className="h-4 w-4" /> Watch Now
          </Link>
          <Link
            to="/anime/$id"
            params={{ id: String(active?.id ?? 0) }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            <Info className="h-4 w-4" /> More Info
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-2">
            Score: {score}
          </span>
          {active?.genres?.slice(0, 4).map((genre) => (
            <span key={genre} className="rounded-full border border-border bg-background/80 px-3 py-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {genre}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slidable.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-2.5 w-2.5 rounded-full transition ${
              index === activeIndex ? "bg-primary" : "bg-white/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
