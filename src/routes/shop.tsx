import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Horizon Roleplay" },
      { name: "description", content: "Buy memberships, cars and in-game cash for Horizon Roleplay." },
    ],
  }),
  component: ShopPage,
});

type Category = "membership" | "cars" | "cash";

const categories: { id: Category; label: string; icon: string }[] = [
  { id: "membership", label: "Membership", icon: "👑" },
  { id: "cars", label: "Cars", icon: "🚗" },
  { id: "cash", label: "Cash", icon: "💵" },
];

const memberships = [
  {
    name: "Classic",
    price: "19.99 dh",
    tier: "classic",
    perks: ["Classic role on Discord", "Access to member events", "Small in-game perks"],
  },
  {
    name: "VIP",
    price: "29.99 dh",
    tier: "vip",
    perks: ["VIP role on Discord", "Priority queue", "Exclusive VIP perks in-game"],
    highlight: true,
  },
  {
    name: "Premium",
    price: "39.99 dh",
    tier: "premium",
    perks: ["Premium role on Discord", "All VIP perks", "Top-tier in-game rewards"],
  },
];

const cashPacks = [
  { amount: "100,000$", price: "7.99 dh" },
  { amount: "250,000$", price: "14.99 dh" },
  { amount: "500,000$", price: "24.99 dh" },
];

function ShopPage() {
  const [category, setCategory] = useState<Category>("membership");
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-black md:text-5xl">Horizon Shop</h1>
        <p className="mt-3 text-muted-foreground">Support the server and unlock exclusive perks.</p>
      </div>

      {/* Category selector */}
      <div className="mt-10 flex justify-center">
        <div
          className="relative"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex min-w-64 items-center justify-between gap-4 rounded-xl border border-primary/40 bg-card/70 px-6 py-3 text-left font-semibold backdrop-blur-sm hover:bg-primary/10"
          >
            <span>
              {categories.find((c) => c.id === category)?.icon}{" "}
              {categories.find((c) => c.id === category)?.label}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {open && (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-lg">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCategory(c.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-primary/20 ${
                    category === c.id ? "bg-primary/15 text-primary-glow" : ""
                  }`}
                >
                  <span className="text-lg">{c.icon}</span>
                  <span className="font-medium">{c.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mt-12">
        {category === "membership" && (
          <div className="grid gap-6 md:grid-cols-3">
            {memberships.map((m) => (
              <div
                key={m.tier}
                className={`relative flex flex-col rounded-2xl border p-6 backdrop-blur-sm transition hover:-translate-y-1 ${
                  m.highlight
                    ? "border-primary/60 bg-gradient-to-b from-primary/20 to-card/60 shadow-[0_20px_60px_-20px_oklch(0.62_0.24_300/0.7)]"
                    : "border-border/60 bg-card/60"
                }`}
              >
                {m.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-black">{m.name}</h3>
                <div className="mt-2 text-3xl font-black text-primary-glow">{m.price}</div>
                <ul className="mt-6 flex-1 space-y-2 text-sm text-muted-foreground">
                  {m.perks.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="text-primary">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
                <button className="mt-6 rounded-lg bg-primary py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110">
                  Buy {m.name}
                </button>
              </div>
            ))}
          </div>
        )}

        {category === "cars" && (
          <div className="rounded-2xl border border-border/60 bg-card/60 p-16 text-center backdrop-blur-sm">
            <div className="text-6xl">🚗</div>
            <h2 className="mt-4 text-3xl font-black">Cars — Coming Soon</h2>
            <p className="mt-3 text-muted-foreground">
              We are preparing a garage full of exclusive vehicles. Stay tuned!
            </p>
          </div>
        )}

        {category === "cash" && (
          <div className="grid gap-6 md:grid-cols-3">
            {cashPacks.map((p) => (
              <div
                key={p.amount}
                className="flex flex-col rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:border-primary/50"
              >
                <div className="text-5xl">💵</div>
                <h3 className="mt-4 text-2xl font-black">{p.amount}</h3>
                <div className="mt-1 text-xl font-bold text-primary-glow">{p.price}</div>
                <button className="mt-6 rounded-lg bg-primary py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110">
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
