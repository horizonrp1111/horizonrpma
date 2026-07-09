import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { submitWhitelist } from "@/lib/whitelist.functions";
import { getDashboard } from "@/lib/account.functions";

const meOptions = queryOptions({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

export const Route = createFileRoute("/whitelist")({
  head: () => ({
    meta: [
      { title: "Whitelist — Horizon Roleplay" },
      { name: "description", content: "Apply for the Horizon Roleplay whitelist." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(meOptions),
  component: WhitelistPage,
});

type FormState = {
  nameIrl: string;
  ageIrl: string;
  nameRp: string;
  ageRp: string;
  serial: string;
  story: string;
};

const initial: FormState = {
  nameIrl: "",
  ageIrl: "",
  nameRp: "",
  ageRp: "",
  serial: "",
  story: "",
};

function WhitelistPage() {
  const { data: me } = useSuspenseQuery(meOptions);
  const send = useServerFn(submitWhitelist);
  const [form, setForm] = useState<FormState>(initial);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      await send({
        data: {
          nameIrl: form.nameIrl,
          ageIrl: Number(form.ageIrl),
          nameRp: form.nameRp,
          ageRp: Number(form.ageRp),
          serial: form.serial,
          story: form.story,
        },
      });
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (!me.profile) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="animate-title-shimmer text-5xl font-black">WHITELIST</h1>
        <p className="mt-6 text-muted-foreground">
          Log in with your Discord account to submit a whitelist application. Only one application per account is allowed.
        </p>
        <a
          href="/api/auth/discord"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110"
        >
          Login with Discord
        </a>
      </section>
    );
  }

  if (me.application) {
    const s = me.application.status;
    const tone =
      s === "approved" ? "text-emerald-300" : s === "denied" ? "text-rose-300" : "text-amber-200";
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-2xl border border-primary/40 bg-card/60 p-10 text-center backdrop-blur-sm">
          <h2 className="text-3xl font-bold">You've already applied</h2>
          <p className="mt-3 text-muted-foreground">
            Only one whitelist application per Discord account.
          </p>
          <p className={`mt-6 text-xl font-semibold uppercase tracking-wide ${tone}`}>Status: {s}</p>
          <Link
            to="/dashboard"
            className="mt-8 inline-flex rounded-lg border border-primary/60 px-6 py-2 font-semibold text-primary-glow hover:bg-primary/10"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-2xl border border-primary/60 bg-card/60 p-10 text-center backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-primary-glow">Application Sent</h2>
          <p className="mt-3 text-muted-foreground">
            Your whitelist application has been submitted. Staff will review it and get back to you on Discord.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex rounded-lg border border-primary/60 px-6 py-2 font-semibold text-primary-glow hover:bg-primary/10"
          >
            View my dashboard
          </Link>
        </div>
      </div>
    );
  }

  const fields: Array<{ key: keyof FormState; label: string; type?: string; placeholder?: string }> = [
    { key: "nameIrl", label: "Name IRL", placeholder: "Your real first name" },
    { key: "ageIrl", label: "Age IRL", type: "number", placeholder: "Your real age" },
    { key: "nameRp", label: "Name RP", placeholder: "Your in-character name" },
    { key: "ageRp", label: "Age RP", type: "number", placeholder: "Your character's age" },
    { key: "serial", label: "Serial", placeholder: "Your MTA serial" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="animate-title-shimmer text-center text-5xl font-black md:text-6xl">WHITELIST</h1>
      <p className="mt-4 text-center text-muted-foreground">
        Applying as <span className="text-primary-glow">{me.profile.global_name || me.profile.username}</span>. Complete every field, then click <span className="text-primary-glow">Send Whitelist</span>.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-12 space-y-5 rounded-2xl border border-border/60 bg-card/60 p-8 backdrop-blur-sm"
      >
        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1.5 block text-sm font-medium">{f.label}</label>
            <input
              required
              type={f.type ?? "text"}
              value={form[f.key]}
              onChange={set(f.key)}
              placeholder={f.placeholder}
              maxLength={80}
              className="w-full rounded-lg border border-border bg-input/40 px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
            />
          </div>
        ))}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Story</label>
          <textarea
            required
            rows={7}
            value={form.story}
            onChange={set("story")}
            placeholder="Write your character's background story (min 20 characters)"
            maxLength={4000}
            className="w-full rounded-lg border border-border bg-input/40 px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/60 bg-destructive/10 px-4 py-2 text-sm text-destructive-foreground">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-lg py-3 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
        >
          {status === "sending" ? "Sending..." : "Send Whitelist"}
        </button>
      </form>
    </div>
  );
}
