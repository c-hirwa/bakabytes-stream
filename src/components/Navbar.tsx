import { useEffect, useState } from "react";
import { Search, Menu, X, Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SearchOverlay } from "./SearchOverlay";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const updateCount = () => {
      const raw = window.localStorage.getItem("favorites");
      const parsed = raw ? JSON.parse(raw) : [];
      setFavoritesCount(Array.isArray(parsed) ? parsed.length : 0);
    };
    updateCount();
    window.addEventListener("storage", updateCount);
    return () => window.removeEventListener("storage", updateCount);
  }, []);

  const links: { label: string; to: string }[] = [
    { label: "Home", to: "/" },
    { label: "Browse", to: "/browse" },
    { label: "Movies", to: "/browse" },
    { label: "This Season", to: "/browse" },
  ];

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-md shadow-lg shadow-black/50" : "bg-gradient-to-b from-background to-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 items-center justify-between px-4 md:px-12">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight">
            <span className="text-primary">Ani</span>
            <span className="text-foreground">Stream</span>
          </span>
        </div>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <li key={link.label}>
              <Link
                to={link.to}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
                activeOptions={{ exact: link.to === "/" }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <button
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            to="/favorites"
            className="relative inline-flex items-center rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary"
          >
            <Heart className="h-4 w-4 text-primary" />
            {favoritesCount > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
                {favoritesCount}
              </span>
            )}
          </Link>
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
            {links.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-3xl bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/favorites"
                onClick={() => setOpen(false)}
                className="block rounded-3xl bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Favorites
              </Link>
            </li>
          </ul>
        </div>
      )}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
