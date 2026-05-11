import { useMemo, useState } from "react";
import type { ConsumetEpisode } from "@/lib/consumet";

export function EpisodeList({
  episodes,
  activeIndex,
  onSelect,
}: {
  episodes: ConsumetEpisode[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const [groupIndex, setGroupIndex] = useState(0);
  const groupSize = 100;

  const groups = useMemo(() => {
    const fullGroups = [];
    for (let start = 0; start < episodes.length; start += groupSize) {
      const end = Math.min(start + groupSize, episodes.length);
      fullGroups.push({
        label: `${start + 1}-${end}`,
        start,
        end,
      });
    }
    return fullGroups;
  }, [episodes.length]);

  const visibleEpisodes = episodes.slice(
    groups[groupIndex]?.start ?? 0,
    groups[groupIndex]?.end ?? episodes.length,
  );

  return (
    <div className="space-y-4">
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {groups.map((group, index) => (
            <button
              key={group.label}
              type="button"
              onClick={() => setGroupIndex(index)}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                index === groupIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border hover:bg-secondary hover:text-foreground"
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-3xl border border-border bg-card p-3 max-h-[70vh] overflow-y-auto">
        <ul className="space-y-2">
          {visibleEpisodes.map((episode, index) => {
            const globalIndex = groups[groupIndex]?.start + index;
            const active = globalIndex === activeIndex;
            return (
              <li key={episode.id}>
                <button
                  type="button"
                  onClick={() => onSelect(globalIndex)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl p-3 text-left transition ${
                    active ? "bg-primary/10 border border-primary" : "bg-background/50 hover:bg-muted"
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold">Episode {episode.number}</div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {episode.title ?? `Episode ${episode.number}`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">Play</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
