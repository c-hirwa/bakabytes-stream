import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/anime/$id")({
  component: AnimePage,
  head: ({ params }) => ({
    meta: [{ title: `Anime #${params.id} — BakaBytes` }],
  }),
});

function AnimePage() {
  const { id } = Route.useParams();
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-sm uppercase tracking-widest text-primary">Anime</p>
        <h1 className="mt-2 text-4xl font-black">#{id}</h1>
        <p className="mt-4 text-muted-foreground">
          Detail page coming soon. We'll wire this up to AniList next.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
