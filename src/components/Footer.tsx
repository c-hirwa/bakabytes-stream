export function Footer() {
  const cols = [
    { title: "Browse", links: ["Trending", "New Releases", "Top Rated", "Genres"] },
    { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
    { title: "Support", links: ["Help Center", "Devices", "Account", "Gift Cards"] },
    { title: "Legal", links: ["Terms", "Privacy", "Cookies", "DMCA"] },
  ];

  return (
    <footer className="mt-12 border-t border-border bg-card/50 px-4 md:px-12 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl">
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">
              {col.title}
            </h4>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-border pt-6">
        <span className="text-2xl font-black">
          <span className="text-primary">Baka</span>
          <span className="text-foreground">Bytes</span>
        </span>
        <p className="text-xs text-muted-foreground">
          © 2026 BakaBytes. All anime, all the time.
        </p>
      </div>
    </footer>
  );
}
