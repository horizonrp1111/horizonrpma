import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getDashboard } from "@/lib/account.functions";
import {
  createStaffApplication,
  getStaffRequestsOpen,
  listMyStaffApplications,
  listStaffApplications,
  setStaffApplicationStatus,
  type StaffApplication,
} from "@/lib/staff.functions";

const meOptions = queryOptions({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff Requests — Horizon Roleplay" },
      { name: "description", content: "Apply to join the Horizon Roleplay staff team." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(meOptions),
  component: StaffPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">Staff error</h1>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
    </div>
  ),
});

function StaffPage() {
  const { data: me } = useSuspenseQuery(meOptions);
  const loadOpen = useServerFn(getStaffRequestsOpen);
  const { data: isOpen } = useQuery({ queryKey: ["staff-open-flag"], queryFn: () => loadOpen() });
  const [showNew, setShowNew] = useState(false);

  if (!me.profile) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="animate-title-shimmer text-5xl font-black">STAFF REQUESTS</h1>
        <p className="mt-6 text-muted-foreground">Log in with Discord to submit a staff request.</p>
        <a
          href="/api/auth/discord"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110"
        >
          Login with Discord
        </a>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary-glow">Join The Team</p>
          <h1 className="text-4xl font-black">Staff Requests</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Signed in as {me.profile.global_name || me.profile.username}
        </p>
      </div>

      {showNew ? (
        <NewStaffRequest onDone={() => setShowNew(false)} onCancel={() => setShowNew(false)} />
      ) : (
        <>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowNew(true)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110"
            >
              + New staff request
            </button>
          </div>
          <MyStaffList />
        </>
      )}
    </section>
  );
}

function NewStaffRequest({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const qc = useQueryClient();
  const create = useServerFn(createStaffApplication);
  const [experience, setExperience] = useState("");
  const [whyJoin, setWhyJoin] = useState("");
  const [howHelp, setHowHelp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await create({ data: { experience, why_join: whyJoin, how_help: howHelp } });
      await qc.invalidateQueries({ queryKey: ["staff-mine"] });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-border/60 bg-card/60 p-8 backdrop-blur-sm">
      <h2 className="text-2xl font-bold">Apply to join the staff team</h2>
      <p className="text-sm text-muted-foreground">You can only have one open staff request at a time.</p>
      <Field label="Experience" value={experience} onChange={setExperience} placeholder="Previous staff experience, communities, moderation, tooling, etc." />
      <Field label="Why do you want to join our team?" value={whyJoin} onChange={setWhyJoin} placeholder="Tell us what draws you to Horizon RP." />
      <Field label="How can you help the server?" value={howHelp} onChange={setHowHelp} placeholder="Skills, availability, ideas, initiatives you'd bring." />
      {err && <p className="rounded-lg border border-destructive/60 bg-destructive/10 px-4 py-2 text-sm text-destructive-foreground">{err}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-lg py-3 font-semibold text-primary-foreground disabled:opacity-60"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
        >
          {busy ? "Sending..." : "Submit request"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-border/60 px-6 py-3 hover:bg-card/60">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <textarea
        required
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={4000}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-input/40 px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
      />
    </div>
  );
}

function MyStaffList() {
  const load = useServerFn(listMyStaffApplications);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["staff-mine"],
    queryFn: () => load(),
  });
  if (isLoading) return <p className="mt-8 text-muted-foreground">Loading…</p>;
  if (isError) return <p className="mt-8 text-rose-400">{(error as Error).message}</p>;
  if (!data || data.length === 0)
    return (
      <p className="mt-8 rounded-xl border border-border/60 bg-card/40 p-8 text-center text-muted-foreground">
        You have no staff requests yet.
      </p>
    );
  return (
    <ul className="mt-8 grid gap-4">
      {data.map((a) => (
        <StaffCard key={a.id} app={a} />
      ))}
    </ul>
  );
}

export function StaffCard({
  app,
  adminControls,
  onChanged,
}: {
  app: StaffApplication;
  adminControls?: boolean;
  onChanged?: () => void;
}) {
  const setStatus = useServerFn(setStaffApplicationStatus);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const badge =
    app.status === "open"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
      : "bg-slate-500/20 text-slate-300 border-slate-500/40";

  async function toggle(next: "open" | "closed") {
    setBusy(true);
    setErr(null);
    try {
      await setStatus({ data: { id: app.id, status: next } });
      onChanged?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl border border-border/60 bg-card/50 p-5">
      <div className="flex flex-wrap items-center gap-4">
        {app.user_avatar_url ? (
          <img src={app.user_avatar_url} alt="" className="h-11 w-11 rounded-full ring-2 ring-primary/40" />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/20 text-sm font-bold">
            {(app.user_global_name || app.user_username || "?")[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{app.user_global_name || app.user_username || app.user_discord_id}</p>
            <span className={`rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide ${badge}`}>{app.status}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Submitted {new Date(app.created_at).toLocaleString()} · ID <span className="font-mono">{app.user_discord_id}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded-lg border border-border/60 px-3 py-1.5 text-sm hover:bg-background/60"
          >
            {expanded ? "Hide" : "View"} answers
          </button>
          {adminControls && app.status === "open" && (
            <button
              onClick={() => toggle("closed")}
              disabled={busy}
              className="rounded-lg bg-rose-500/90 px-3 py-1.5 text-sm font-semibold text-rose-950 hover:bg-rose-400 disabled:opacity-50"
            >
              {busy ? "…" : "Close request"}
            </button>
          )}
          {adminControls && app.status === "closed" && (
            <button
              onClick={() => toggle("open")}
              disabled={busy}
              className="rounded-lg bg-emerald-500/90 px-3 py-1.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {busy ? "…" : "Reopen"}
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="mt-4 grid gap-3">
          <Answer title="Experience" body={app.experience} />
          <Answer title="Why they want to join our team" body={app.why_join} />
          <Answer title="How they can help the server" body={app.how_help} />
        </div>
      )}
      {err && <p className="mt-3 text-sm text-rose-400">{err}</p>}
    </li>
  );
}

function Answer({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-4">
      <p className="text-xs uppercase tracking-widest text-primary-glow">{title}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{body}</p>
    </div>
  );
}
