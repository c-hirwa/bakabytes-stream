import { createFileRoute } from "@tanstack/react-router";
import { AnimePage } from "@/pages/AnimePage";

export const Route = createFileRoute("/anime/$id")({
  component: AnimePage,
  head: ({ params }) => ({
    meta: [{ title: `Anime #${params.id} — BakaBytes` }],
  }),
});
