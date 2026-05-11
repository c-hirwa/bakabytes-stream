import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/watch/$animeId/$episodeIndex")({
  component: WatchPage,
  head: ({ params }) => ({
    meta: [{ title: `Watch — Episode ${params.episodeIndex}` }],
  }),
});

function WatchPage() {
  const { animeId, episodeIndex } = Route.useParams();
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-sm uppercase tracking-widest text-primary">Watch</p>
        <h1 className="mt-2 text-3xl font-black">Anime #{animeId} — Episode {Number(episodeIndex) + 1}</h1>
        <p className="mt-4 text-muted-foreground">Player coming soon.</p>
        <Link to="/anime/$id" params={{ id: animeId }} className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Back to details
        </Link>
      </div>
    </div>
  );
}
