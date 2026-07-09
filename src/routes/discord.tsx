import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/discord")({
  head: () => ({
    meta: [
      { title: "Discord — Horizon Roleplay" },
      { name: "description", content: "Join the Horizon Roleplay Discord community." },
    ],
  }),
  component: DiscordPage,
});

function DiscordPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
      <div className="rounded-3xl border border-border/60 bg-card/60 p-12 backdrop-blur-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#5865F2] text-white">
          <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor" aria-hidden>
            <path d="M20.317 4.369A19.79 19.79 0 0016.558 3c-.2.36-.43.842-.588 1.226a18.27 18.27 0 00-5.487 0A12.36 12.36 0 009.883 3a19.72 19.72 0 00-3.76 1.369C2.61 9.72 1.66 14.94 2.135 20.086A19.9 19.9 0 008.09 22c.48-.66.905-1.362 1.27-2.1-.7-.263-1.37-.588-2.006-.968.168-.124.332-.253.49-.386 3.86 1.79 8.038 1.79 11.85 0 .16.133.324.262.492.386-.638.38-1.31.706-2.008.969.365.737.79 1.44 1.27 2.099a19.87 19.87 0 005.957-1.914c.56-6.02-.955-11.192-3.797-15.717zM9.35 15.548c-1.183 0-2.157-1.086-2.157-2.42 0-1.336.955-2.421 2.157-2.421 1.21 0 2.176 1.093 2.157 2.42 0 1.335-.955 2.421-2.157 2.421zm5.315 0c-1.183 0-2.157-1.086-2.157-2.42 0-1.336.955-2.421 2.157-2.421 1.21 0 2.176 1.093 2.157 2.42 0 1.335-.947 2.421-2.157 2.421z" />
          </svg>
        </div>
        <h1 className="mt-6 text-4xl font-black md:text-5xl">Join Our Discord</h1>
        <p className="mt-4 text-muted-foreground">
          Connect with the community, get server news, participate in events, and reach out to staff.
        </p>
        <a
          href="https://discord.gg/Gzr86w3sBm"
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-block rounded-lg bg-[#5865F2] px-10 py-4 text-lg font-semibold text-white shadow-[0_15px_40px_-10px_rgba(88,101,242,0.7)] transition-transform hover:scale-105"
        >
          Join Discord Server
        </a>
      </div>
    </div>
  );
}
