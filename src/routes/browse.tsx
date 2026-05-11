import { createFileRoute } from "@tanstack/react-router";
import { BrowsePage } from "@/pages/Browse";

export const Route = createFileRoute("/browse")({
  component: BrowsePage,
  head: () => ({
    meta: [
      { title: "Browse Anime — BakaBytes" },
      { name: "description", content: "Search and filter anime by genre on BakaBytes." },
    ],
  }),
});
