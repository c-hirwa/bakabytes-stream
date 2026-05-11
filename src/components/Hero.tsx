import { Play, Plus, Info } from "lucide-react";
import heroImg from "@/assets/hero-anime.jpg";
import type { AnimeMedia } from "@/lib/anilist";

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function Hero({ featured }: { featured?: AnimeMedia }) {
  const bg = featured?.bannerImage ?? heroImg;
  const title = featured
    ? featured.title.english ?? featured.title.romaji
    : "Crimson Blade";
  const description = featured
    ? stripHtml(featured.description) ||
      "An unforgettable anime experience awaits."
    : "In a neon-soaked metropolis ruled by syndicates, a lone swordsman wielding a blade forged from starlight hunts the demons of his past.";
  const score = featured?.averageScore ? (featured.averageScore / 10).toFixed(1) : "9.4";
  const year = featured?.seasonYear ?? 2026;
  const episodes = featured?.episodes ?? 24;

  return (
    <section className="relative h-[85vh] min-h-[600px] w-full overflow-hidden">
      <img
        src={bg}
        alt={title}
        width={1920}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />

      <div className="relative z-10 flex h-full items-end pb-24 md:items-center md:pb-0">
        <div className="max-w-2xl px-4 md:px-12">
          <span className="inline-block rounded bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary border border-primary/40">
            Featured Series
          </span>
          <h1 className="mt-4 text-4xl md:text-7xl font-black leading-[0.9] tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed line-clamp-4">
            {description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40">
              <Play className="h-5 w-5 fill-current" /> Watch Now
            </button>
            <button className="inline-flex items-center gap-2 rounded-md bg-secondary/80 backdrop-blur px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-secondary">
              <Plus className="h-5 w-5" /> My List
            </button>
            <button className="inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-secondary/50">
              <Info className="h-5 w-5" /> Details
            </button>
          </div>
          <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="text-primary font-bold">★ {score}</span>
            <span>{year}</span>
            <span className="rounded border border-border px-2 py-0.5 text-xs">TV-MA</span>
            <span>{episodes} Episodes</span>
          </div>
        </div>
      </div>
    </section>
  );
}
