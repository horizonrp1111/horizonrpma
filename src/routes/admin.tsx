import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getDashboard } from "@/lib/account.functions";
import {
  grantAdmin,
  listAdmins,
  listApplications,
  moderateApplication,
  revokeAdmin,
  type AdminApplication,
  type AdminMember,
} from "@/lib/admin.functions";

const meOptions = queryOptions({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Horizon Roleplay" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(meOptions),
  component: AdminPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">Admin error</h1>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
    </div>
  ),
});

type Tab = "pending" | "approved" | "denied" | "admins";

function AdminPage() {
  const { data: me } = useSuspenseQuery(meOptions);
  const [tab, setTab] = useState<Tab>("pending");

  if (!me.profile) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Login required</h1>
        <a
          href="/api/auth/discord"
          className="mt-6 inline-flex rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110"
        >
          Login with Discord
        </a>
      </section>
    );
  }
  if (!me.profile.is_admin) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Access denied</h1>
        <p className="mt-3 text-muted-foreground">This area is restricted to administrators.</p>
      </section>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Whitelisted" },
    { id: "denied", label: "Rejected" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary-glow">Administrator</p>
          <h1 className="text-4xl font-black">Admin Panel</h1>
        </div>
        <p className="text-sm text-muted-foreground">Signed in as {me.profile.global_name || me.profile.username}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "border border-border/60 bg-card/40 hover:bg-card/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <ApplicationsTab status={tab} />
      </div>
    </section>
  );
}

function ApplicationsTab({ status }: { status: "pending" | "approved" | "denied" }) {
  const load = useServerFn(listApplications);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-apps", status],
    queryFn: () => load({ data: { status } }),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (isError) return <p className="text-rose-400">{(error as Error).message}</p>;
  if (!data || data.length === 0)
    return <p className="rounded-xl border border-border/60 bg-card/40 p-8 text-center text-muted-foreground">Nothing here yet.</p>;

  return (
    <div className="grid gap-4">
      {data.map((app) => (
        <ApplicationCard key={app.id} app={app} showActions={status === "pending"} />
      ))}
    </div>
  );
}

function ApplicationCard({ app, showActions }: { app: AdminApplication; showActions: boolean }) {
  const qc = useQueryClient();
  const moderate = useServerFn(moderateApplication);
  const [busy, setBusy] = useState<null | "approve" | "deny">(null);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function act(action: "approve" | "deny") {
    setBusy(action);
    setErr(null);
    try {
      await moderate({ data: { id: app.id, action } });
      await qc.invalidateQueries({ queryKey: ["admin-apps"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  const badge =
    app.status === "approved"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
      : app.status === "denied"
        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
        : "bg-amber-500/20 text-amber-200 border-amber-500/40";

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-5">
      <div className="flex flex-wrap items-center gap-4">
        {app.discord_avatar_url ? (
          <img src={app.discord_avatar_url} alt="" className="h-12 w-12 rounded-full ring-2 ring-primary/40" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-lg font-bold">
            {(app.discord_global_name || app.discord_username || app.name_rp)[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{app.name_rp} <span className="text-muted-foreground">(RP {app.age_rp})</span></p>
            <span className={`rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide ${badge}`}>{app.status}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {app.discord_global_name || app.discord_username || "no discord profile"}
            {app.discord_id && <span className="ml-2 font-mono">· ID {app.discord_id}</span>}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            IRL: {app.name_irl} ({app.age_irl}) · Serial <span className="font-mono">{app.serial}</span> · Submitted {new Date(app.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded-lg border border-border/60 px-3 py-1.5 text-sm hover:bg-background/60"
          >
            {expanded ? "Hide" : "View"} story
          </button>
          {showActions && (
            <>
              <button
                onClick={() => act("approve")}
                disabled={!!busy}
                className="rounded-lg bg-emerald-500/90 px-3 py-1.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {busy === "approve" ? "…" : "Approve"}
              </button>
              <button
                onClick={() => act("deny")}
                disabled={!!busy}
                className="rounded-lg bg-rose-500/90 px-3 py-1.5 text-sm font-semibold text-rose-950 hover:bg-rose-400 disabled:opacity-50"
              >
                {busy === "deny" ? "…" : "Decline"}
              </button>
            </>
          )}
        </div>
      </div>
      {expanded && (
        <p className="mt-4 whitespace-pre-wrap rounded-lg border border-border/40 bg-background/40 p-4 text-sm">{app.story}</p>
      )}
      {err && <p className="mt-3 text-sm text-rose-400">{err}</p>}
    </div>
  );
}


function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone === "ok" ? "text-emerald-300" : ""}`}>{value}</p>
    </div>
  );
}
