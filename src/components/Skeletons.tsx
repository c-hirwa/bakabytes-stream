export function AnimeRowSkeleton({ title }: { title: string }) {
  return (
    <section className="relative py-6">
      <div className="mb-4 px-4 md:px-12">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
          <span className="border-l-4 border-primary pl-3">{title}</span>
        </h2>
      </div>
      <div className="flex gap-4 overflow-hidden px-4 md:px-12 pb-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="w-[180px] sm:w-[200px] flex-shrink-0 aspect-[2/3] rounded-md bg-card animate-pulse"
          />
        ))}
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <section className="relative h-[85vh] min-h-[600px] w-full overflow-hidden bg-card animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="relative z-10 flex h-full items-end pb-24 md:items-center md:pb-0">
        <div className="max-w-2xl px-4 md:px-12 space-y-4">
          <div className="h-6 w-32 rounded bg-secondary" />
          <div className="h-16 w-3/4 rounded bg-secondary" />
          <div className="h-4 w-full rounded bg-secondary" />
          <div className="h-4 w-2/3 rounded bg-secondary" />
          <div className="h-12 w-48 rounded bg-secondary" />
        </div>
      </div>
    </section>
  );
}
