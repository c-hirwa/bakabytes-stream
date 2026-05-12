import { createFileRoute } from "@tanstack/react-router";
import { WatchPage } from "@/pages/WatchPage";

export const Route = createFileRoute("/watch/$animeId/$episodeNumber")({
  component: WatchPage,
  head: ({ params }) => ({
    meta: [{ title: `Watch — Episode ${Number(params.episodeNumber)}` }],
  }),
});

