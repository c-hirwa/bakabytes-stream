import { createFileRoute } from "@tanstack/react-router";
import { WatchPage } from "@/pages/WatchPage";

// Kept for backwards-compat: /watch/:animeId/:episodeIndex (0-based)
// Redirects to the new 1-based route at /watch/:animeId/:episodeNumber
export const Route = createFileRoute("/watch/$animeId/$episodeIndex")({
  component: WatchPage,
  head: ({ params }) => ({
    meta: [{ title: `Watch — Episode ${Number(params.episodeIndex) + 1}` }],
  }),
});
