import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Rules — Horizon Roleplay" },
      { name: "description", content: "Server rules for Horizon Roleplay MTA:SA community." },
    ],
  }),
  component: RulesPage,
});

const rules = [
  { t: "Respect All Players", d: "Harassment, hate speech, or toxicity of any kind is not tolerated." },
  { t: "No Metagaming", d: "Do not use out-of-character information in-character." },
  { t: "No Powergaming", d: "Do not force actions on other players or roleplay unrealistic abilities." },
  { t: "Value Your Life", d: "Roleplay fear and self-preservation appropriately in dangerous situations." },
  { t: "No Random Deathmatch (RDM)", d: "You must have a valid IC reason before initiating any violent action." },
  { t: "No Vehicle Deathmatch (VDM)", d: "Do not use vehicles as weapons without proper roleplay context." },
  { t: "Quality Roleplay", d: "Effort in typing, character depth, and immersion is expected at all times." },
  { t: "Follow Staff Instructions", d: "Staff decisions are final. Appeal through proper channels on Discord." },
];

function RulesPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="animate-title-shimmer text-center text-5xl font-black md:text-6xl">SERVER RULES</h1>
      <p className="mt-4 text-center text-muted-foreground">Read carefully — ignorance is not an excuse.</p>

      <ol className="mt-12 space-y-4">
        {rules.map((r, i) => (
          <li
            key={r.t}
            className="flex gap-4 rounded-xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm transition-colors hover:border-primary/60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 font-bold text-primary-glow">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="font-semibold text-primary-glow">{r.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{r.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
