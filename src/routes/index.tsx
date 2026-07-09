import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import logoAsset from "@/assets/horizon-logo.png.asset.json";
const logo = logoAsset.url;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Horizon Roleplay — Home" },
      { name: "description", content: "Welcome to Horizon Roleplay, an immersive MTA:SA role-play server." },
    ],
  }),
  component: HomePage,
});

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const nodes = ref.current?.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!nodes) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("opacity-100", "translate-y-0");
            e.target.classList.remove("opacity-0", "translate-y-10");
          }
        }
      },
      { threshold: 0.15 }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return ref;
}

function HomePage() {
  const ref = useReveal();

  return (
    <div ref={ref}>
      {/* HERO */}
      <section className="relative flex min-h-[calc(100vh-73px)] flex-col items-center justify-center px-6 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
        </div>

        <img
          src={logo}
          alt="Horizon Roleplay Logo"
          width={220}
          height={220}
          className="animate-logo-float h-40 w-40 md:h-56 md:w-56"
        />

        <h1 className="animate-title-shimmer mt-8 text-5xl font-black tracking-tight md:text-7xl">
          HORIZON ROLEPLAY
        </h1>
        <p className="animate-fade-up mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl" style={{ animationDelay: "0.3s" }}>
          An immersive MTA:SA role-play experience. Live your story.
        </p>

        <div className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-4" style={{ animationDelay: "0.5s" }}>
          <a
            href="https://discord.gg/Gzr86w3sBm"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-[#5865F2] px-7 py-3 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(88,101,242,0.7)] transition-transform hover:scale-105"
          >
            Join Discord
          </a>
          <a
            href="https://mtasa.com/"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg px-7 py-3 text-base font-semibold text-primary-foreground transition-transform hover:scale-105"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            Download MTA:SA
          </a>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground text-sm">
          ↓ Scroll
        </div>
      </section>

      {/* FEATURES with scroll reveal */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div
          data-reveal
          className="opacity-0 translate-y-10 transition-all duration-700 text-center"
        >
          <h2 className="text-4xl font-bold md:text-5xl">Built for Roleplay</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Deep systems, active staff, and a serious community — everything you need for unforgettable stories.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            { title: "Immersive World", body: "Living San Andreas with dynamic storylines and player-driven events." },
            { title: "Fair Administration", body: "Active, trained staff enforcing balanced rules for everyone." },
            { title: "Growing Community", body: "A passionate player base and creators shaping the server's future." },
          ].map((f, i) => (
            <div
              key={f.title}
              data-reveal
              className="opacity-0 translate-y-10 transition-all duration-700 rounded-2xl border border-border/60 bg-card/60 p-8 backdrop-blur-sm hover:border-primary/60 hover:shadow-[0_0_40px_-10px_var(--primary)]"
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary-glow text-xl font-bold">
                {i + 1}
              </div>
              <h3 className="text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>

        <div data-reveal className="opacity-0 translate-y-10 transition-all duration-700 mt-20 text-center">
          <Link
            to="/about"
            className="inline-block rounded-lg border border-primary/60 px-8 py-3 text-primary-glow transition-colors hover:bg-primary/10"
          >
            Learn More About Us →
          </Link>
        </div>
      </section>
    </div>
  );
}
