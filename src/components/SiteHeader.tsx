import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import logoAsset from "@/assets/horizon-logo.png.asset.json";
const logo = logoAsset.url;
import { getDashboard } from "@/lib/account.functions";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/rules", label: "Rules" },
  { to: "/whitelist", label: "Whitelist" },
  { to: "/discord", label: "Discord" },
  { to: "/shop", label: "Shop" },
  { to: "/support", label: "Support" },
  { to: "/staff", label: "Staff" },
] as const;

export function SiteHeader() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboard(),
    staleTime: 60_000,
  });
  const profile = data?.profile ?? null;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link to="/" className="group flex min-w-0 items-center gap-2 sm:gap-3" onClick={() => setMenuOpen(false)}>
          <img src={logo} alt="Horizon Roleplay" width={40} height={40} className="h-9 w-9 shrink-0 transition-transform group-hover:rotate-12 sm:h-10 sm:w-10" />
          <span className="truncate text-base font-bold tracking-wide sm:text-lg">
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
        <div className="flex shrink-0 items-center gap-2">
          {profile?.is_admin && (
            <Link
              to="/admin"
              className="hidden items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-400/20 sm:inline-flex"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z" />
              </svg>
              Admin
            </Link>
          )}
          {profile ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 py-1 pl-1 pr-2 text-sm font-medium hover:bg-primary/20 sm:pr-3"
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/30 text-xs font-bold">
                  {(profile.global_name || profile.username)[0]?.toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline">{profile.global_name || profile.username}</span>
            </Link>
          ) : (
            <a
              href="/api/auth/discord"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110 sm:px-4"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M20.317 4.492A19.79 19.79 0 0 0 16.558 3a13.66 13.66 0 0 0-.617 1.263 18.523 18.523 0 0 0-5.882 0A13.6 13.6 0 0 0 9.442 3a19.87 19.87 0 0 0-3.76 1.492C2.16 9.784 1.204 14.94 1.68 20.024a19.9 19.9 0 0 0 6.073 3.048c.49-.669.926-1.38 1.302-2.13a12.9 12.9 0 0 1-2.05-.98c.172-.126.34-.257.502-.39a14.27 14.27 0 0 0 12.185 0c.163.133.33.264.502.39-.653.386-1.34.717-2.052.98.376.75.812 1.461 1.302 2.13a19.86 19.86 0 0 0 6.075-3.048c.556-5.884-.951-10.995-3.982-15.532zM9.68 16.42c-1.183 0-2.157-1.085-2.157-2.42s.955-2.42 2.157-2.42c1.2 0 2.176 1.086 2.156 2.42.001 1.335-.955 2.42-2.156 2.42zm7.974 0c-1.183 0-2.156-1.085-2.156-2.42s.954-2.42 2.156-2.42c1.203 0 2.176 1.086 2.156 2.42 0 1.335-.953 2.42-2.156 2.42z"/>
              </svg>
              <span className="hidden sm:inline">Login</span>
            </a>
          )}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-card/50 text-foreground hover:bg-primary/10 md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </>
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-4 py-3 text-base font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary-foreground"
                activeProps={{ className: "rounded-md px-4 py-3 text-base font-semibold bg-primary/20 text-primary-glow" }}
                activeOptions={{ exact: true }}
              >
                {item.label}
              </Link>
            ))}
            {profile?.is_admin && (
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="mt-1 flex items-center gap-2 rounded-md border border-amber-400/50 bg-amber-400/10 px-4 py-3 text-base font-semibold text-amber-200"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z" />
                </svg>
                Admin
              </Link>
            )}
          </nav>
        </div>
      )}
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
