import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/rules", label: "Rules" },
  { to: "/whitelist", label: "Whitelist" },
  { to: "/discord", label: "Discord" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logo} alt="Horizon Roleplay" width={40} height={40} className="h-10 w-10 transition-transform group-hover:rotate-12" />
          <span className="text-lg font-bold tracking-wide">
            HORIZON <span className="text-primary">RP</span>
          </span>
        </Link>
        <nav className="hidden gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary-foreground"
              activeProps={{ className: "rounded-md px-4 py-2 text-sm font-semibold bg-primary/20 text-primary-glow" }}
              activeOptions={{ exact: true }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
      <p>© {new Date().getFullYear()} Horizon Roleplay. ALL RIGHTS RESERVED.</p>
    </footer>
  );
}
