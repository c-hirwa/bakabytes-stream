import { useEffect, useState } from "react";
import { Search, Menu, X } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["Home", "Browse", "My List"];

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-md shadow-lg shadow-black/50" : "bg-gradient-to-b from-background to-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 items-center justify-between px-4 md:px-12">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight">
            <span className="text-primary">Baka</span>
            <span className="text-foreground">Bytes</span>
          </span>
        </div>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <li key={l}>
              <a
                href="#"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <button
            aria-label="Search"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="h-5 w-5" />
          </button>
          <button className="hidden md:inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30">
            Login
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-foreground"
            aria-label="Menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <ul className="flex flex-col p-4 gap-2">
            {links.map((l) => (
              <li key={l}>
                <a href="#" className="block py-2 text-sm font-medium text-foreground">
                  {l}
                </a>
              </li>
            ))}
            <li>
              <button className="mt-2 w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Login
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
