import { createFileRoute } from "@tanstack/react-router";
import logoAsset from "@/assets/horizon-logo.png.asset.json";
const logo = logoAsset.url;

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Horizon Roleplay" },
      { name: "description", content: "Learn about Horizon Roleplay — an immersive MTA:SA role-play community." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <div className="text-center">
        <img src={logo} alt="Horizon Roleplay" width={120} height={120} loading="lazy" className="mx-auto h-28 w-28 animate-logo-float" />
        <h1 className="animate-title-shimmer mt-8 text-4xl font-black md:text-6xl">
          WELCOME TO HORIZON ROLEPLAY
        </h1>
      </div>

      <div className="mt-14 space-y-8 text-lg leading-relaxed text-foreground/90">
        <p className="rounded-2xl border border-border/60 bg-card/60 p-8 backdrop-blur-sm">
          <strong className="text-primary-glow">Horizon RolePlay</strong>, established recently, is an evolving MTA server designed to
          deliver a high-quality and immersive role-playing experience within the Grand Theft Auto world.
          With a passionate and active staff team, Horizon RP is quickly becoming a strong community for
          both players and content creators.
        </p>

        <div className="rounded-2xl border border-border/60 bg-card/60 p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-primary-glow">Immersive Role-Play</h2>
          <p className="mt-4">
            Horizon RolePlay offers a rich and dynamic role-play environment where players can create
            unique characters and live out engaging storylines. From law enforcement to civilians and
            criminal activities, every interaction is driven by realism and creativity.
          </p>
          <p className="mt-4">
            The server maintains a fair and structured system with active administration to ensure all
            rules are respected, providing a balanced and enjoyable experience for everyone.
          </p>
          <p className="mt-4">
            Our goal is to build a serious yet fun RP atmosphere where every player can grow, interact,
            and create unforgettable moments.
          </p>
        </div>

        <p className="text-center text-sm tracking-widest text-muted-foreground">
          ALL RIGHTS RESERVED
        </p>
      </div>
    </div>
  );
}
