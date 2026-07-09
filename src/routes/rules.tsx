import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Rules — Horizon Roleplay" },
      { name: "description", content: "Roleplay, legal, and illegal rules for Horizon Roleplay MTA:SA server." },
    ],
  }),
  component: RulesPage,
});

type Rule = { t: string; d: string };
type Category = { title: string; blurb: string; accent: string; rules: Rule[] };

const categories: Category[] = [
  {
    title: "Roleplay Rules",
    blurb: "Core rules that keep the immersion alive for everyone on the server.",
    accent: "from-purple-500/40 to-fuchsia-500/20",
    rules: [
      { t: "Stay In Character (IC)", d: "Keep all in-game chat in character. Use Discord or /b for out-of-character talk." },
      { t: "No Metagaming", d: "Do not use out-of-character information inside roleplay (Discord names, streams, etc.)." },
      { t: "No Powergaming", d: "Do not force actions on others or perform unrealistic feats your character couldn't do." },
      { t: "Value Your Life (VYL)", d: "Roleplay realistic fear when your life is threatened, especially at gunpoint." },
      { t: "Fear Roleplay (FearRP)", d: "React to weapons and danger the way a real person would — hands up, comply, negotiate." },
      { t: "Quality of Roleplay", d: "Type properly, describe actions, and put real effort into your character's depth." },
      { t: "No Mixing IC/OOC", d: "Never use OOC information in-character, and never bring IC grudges to OOC channels." },
      { t: "Respect Everyone", d: "Toxicity, harassment, racism, and hate speech are strictly forbidden — IC or OOC." },
      { t: "Follow Staff Decisions", d: "Staff calls are final on the server. Appeal properly through Discord tickets." },
    ],
  },
  {
    title: "Legal Rules",
    blurb: "Rules for civilians, workers, and law enforcement — non-criminal gameplay.",
    accent: "from-emerald-500/30 to-teal-500/10",
    rules: [
      { t: "Obey Traffic Laws", d: "Follow speed limits, stop at red lights, and drive on the correct side of the road." },
      { t: "Realistic Jobs", d: "Perform your legal job (EMS, mechanic, taxi, LSPD, etc.) with proper roleplay standards." },
      { t: "No Job Abuse", d: "Do not use job perks (medical revives, police vehicles, tow trucks) for personal gain." },
      { t: "Emergency Services Priority", d: "Give way to EMS/PD sirens and never block scenes without a valid IC reason." },
      { t: "Respect Private Property", d: "Do not enter houses, garages, or properties without permission or a legal warrant." },
      { t: "Weapon Licensing", d: "Civilians must hold a valid license to carry a firearm openly in public." },
      { t: "Reporting Crimes", d: "Witnesses should report crimes via /call 911 rather than intervene as vigilantes." },
    ],
  },
  {
    title: "Illegal Rules",
    blurb: "Rules for criminal roleplay — gangs, heists, and organized crime.",
    accent: "from-rose-500/30 to-red-500/10",
    rules: [
      { t: "Valid Reason Required", d: "Never open fire, rob, or kidnap without a strong in-character reason (RDM is banned)." },
      { t: "No RDM / VDM", d: "Random Deathmatch and Vehicle Deathmatch result in an immediate ban." },
      { t: "Robbery Limits", d: "Robberies must involve roleplay — no silent, instant, or drive-by robberies." },
      { t: "New Life Rule (NLR)", d: "After being killed you forget the events leading to your death and cannot return for 15 minutes." },
      { t: "Group / Gang Size", d: "Max 6 players per active criminal operation unless staff-approved." },
      { t: "No Cop Baiting", d: "Do not commit petty crimes purely to attract or troll police officers." },
      { t: "Hostage Rules", d: "Hostages must be given time to comply. Killing compliant hostages without escalation is forbidden." },
      { t: "No Powergaming Escapes", d: "Do not fake-die, log out mid-arrest, or use exploits to avoid consequences." },
      { t: "Green Zones", d: "No illegal activities inside hospitals, police departments, or other safe zones." },
    ],
  },
];

function RulesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="animate-title-shimmer text-center text-5xl font-black md:text-6xl">SERVER RULES</h1>
      <p className="mt-4 text-center text-muted-foreground">
        Read every section carefully — ignorance is not an excuse.
      </p>

      <div className="mt-16 space-y-16">
        {categories.map((cat) => (
          <section key={cat.title}>
            <div className={`rounded-2xl border border-border/60 bg-gradient-to-r ${cat.accent} p-6 backdrop-blur-sm`}>
              <h2 className="text-3xl font-bold md:text-4xl">{cat.title}</h2>
              <p className="mt-2 text-muted-foreground">{cat.blurb}</p>
            </div>

            <ol className="mt-6 grid gap-4 md:grid-cols-2">
              {cat.rules.map((r, i) => (
                <li
                  key={r.t}
                  className="flex gap-4 rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm transition-colors hover:border-primary/60"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-sm font-bold text-primary-glow">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-semibold text-primary-glow">{r.t}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{r.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
