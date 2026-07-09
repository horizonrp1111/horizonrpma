import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/whitelist")({
  head: () => ({
    meta: [
      { title: "Whitelist — Horizon Roleplay" },
      { name: "description", content: "Apply for the Horizon Roleplay whitelist." },
    ],
  }),
  component: WhitelistPage,
});

function WhitelistPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="animate-title-shimmer text-center text-5xl font-black md:text-6xl">WHITELIST</h1>
      <p className="mt-4 text-center text-muted-foreground">
        Join our community. Fill out the form below to apply.
      </p>

      {submitted ? (
        <div className="mt-12 rounded-2xl border border-primary/60 bg-card/60 p-10 text-center backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-primary-glow">Application Received</h2>
          <p className="mt-2 text-muted-foreground">
            Our staff will review your application and contact you on Discord.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="mt-12 space-y-5 rounded-2xl border border-border/60 bg-card/60 p-8 backdrop-blur-sm"
        >
          {[
            { label: "In-Game Nickname", type: "text", name: "nick" },
            { label: "Discord Username", type: "text", name: "discord" },
            { label: "Age", type: "number", name: "age" },
          ].map((f) => (
            <div key={f.name}>
              <label className="mb-1.5 block text-sm font-medium">{f.label}</label>
              <input
                required
                type={f.type}
                name={f.name}
                className="w-full rounded-lg border border-border bg-input/40 px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
              />
            </div>
          ))}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Character Background Story</label>
            <textarea
              required
              rows={6}
              name="story"
              className="w-full rounded-lg border border-border bg-input/40 px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg py-3 font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            Submit Application
          </button>
        </form>
      )}
    </div>
  );
}
