import { Link, Outlet } from "@tanstack/react-router";

const nav = [
  { to: "/", label: "Pantry" },
  { to: "/inventory", label: "Inventory" },
  { to: "/recipes", label: "Recipes" },
  { to: "/grocery", label: "Grocery Lists" },
  { to: "/usage", label: "Usage Log" },
  { to: "/manage", label: "Manage" },
];

export function AppShell() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-3xl group-hover:rotate-12 transition-transform">🥬</span>
            <span className="font-display text-2xl font-bold text-primary">
              Snack <span className="text-tomato">Overflow</span>
            </span>
          </Link>
          <nav className="ml-auto flex flex-wrap gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
                activeProps={{ className: "px-3 py-1.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-muted-foreground py-6">
        Made with 🥕 — keeping your pantry full and fresh
      </footer>
    </div>
  );
}
