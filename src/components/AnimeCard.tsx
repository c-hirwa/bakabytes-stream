import { Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { AnimeMedia } from "@/lib/anilist";

export function AnimeCard({ anime }: { anime: AnimeMedia }) {
  const title = anime.title.english ?? anime.title.romaji;
  const cover = anime.coverImage.extraLarge ?? anime.coverImage.large;
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "N/A";

  return (
    <Link
      to="/anime/$id"
      params={{ id: String(anime.id) }}
      className="group relative w-[180px] sm:w-[200px] flex-shrink-0 cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-10"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-card">
        <img
          src={cover}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

        {anime.averageScore != null && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-black/80 px-2 py-1 text-xs font-semibold text-primary backdrop-blur">
            <Star className="h-3 w-3 fill-primary" />
            {score}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{title}</h3>
          {anime.episodes != null && (
            <p className="mt-1 text-xs text-muted-foreground">{anime.episodes} Episodes</p>
          )}
          {anime.genres?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {anime.genres.slice(0, 2).map((g) => (
                <span
                  key={g}
                  className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
