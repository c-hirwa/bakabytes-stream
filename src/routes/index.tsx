import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/Home";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "BakaBytes — Stream Anime Without Limits" },
      {
        name: "description",
        content:
          "BakaBytes is your home for streaming the best anime — trending series, seasonal hits, and timeless classics in one dark, immersive player.",
      },
    ],
  }),
});
