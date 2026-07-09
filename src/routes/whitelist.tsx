import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { submitWhitelist } from "@/lib/whitelist.functions";

export const Route = createFileRoute("/whitelist")({
  head: () => ({
    meta: [
      { title: "Whitelist — Horizon Roleplay" },
      { name: "description", content: "Apply for the Horizon Roleplay whitelist." },
    ],
  }),
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

  if (status === "done") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-2xl border border-primary/60 bg-card/60 p-10 text-center backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-primary-glow">Application Sent</h2>
          <p className="mt-3 text-muted-foreground">
            Your whitelist application has been delivered to our staff. We'll get back to you on Discord.
          </p>
          <button
            onClick={() => {
              setForm(initial);
              setStatus("idle");
            }}
            className="mt-6 rounded-lg border border-primary/60 px-6 py-2 text-primary-glow hover:bg-primary/10"
          >
            Submit another
          </button>
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
        Complete every field, then click <span className="text-primary-glow">Send Whitelist</span>.
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
