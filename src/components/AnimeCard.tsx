import { Star } from "lucide-react";

export interface Anime {
  title: string;
  image: string;
  episodes: number;
  score: number;
}

export function AnimeCard({ anime }: { anime: Anime }) {
  return (
    <div className="group relative w-[180px] sm:w-[200px] flex-shrink-0 cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-10">
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-card">
        <img
          src={anime.image}
          alt={anime.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-black/80 px-2 py-1 text-xs font-semibold text-primary backdrop-blur">
          <Star className="h-3 w-3 fill-primary" />
          {anime.score.toFixed(1)}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{anime.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{anime.episodes} Episodes</p>
        </div>
      </div>
    </div>
  );
}
