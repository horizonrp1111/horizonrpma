import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { getDashboard, linkSerial, unlinkSerial } from "@/lib/account.functions";

const dashOptions = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => getDashboard(),
});

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Horizon Roleplay" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashOptions),
  component: DashboardPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">Dashboard error</h1>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
    </div>
  ),
});

function DashboardPage() {
  const { data } = useSuspenseQuery(dashOptions);
  const qc = useQueryClient();
  const link = useServerFn(linkSerial);
  const unlink = useServerFn(unlinkSerial);
  const [serial, setSerial] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!data.profile) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Login required</h1>
        <p className="mt-4 text-muted-foreground">Sign in with your Discord account to access your dashboard.</p>
        <a
          href="/api/auth/discord"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110"
        >
          Login with Discord
        </a>
      </section>
    );
  }

  const p = data.profile;
  const displayName = p.global_name || p.username;

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await link({ data: { serial: serial.trim() } });
      setSerial("");
      setMsg({ kind: "ok", text: "Serial linked to your account." });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Failed to link" });
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlink() {
    setBusy(true);
    setMsg(null);
    try {
      await unlink();
      setMsg({ kind: "ok", text: "Character unlinked." });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    } finally {
      setBusy(false);
    }
  }

  const statusColor =
    data.application?.status === "approved"
      ? "text-emerald-400"
      : data.application?.status === "denied"
        ? "text-rose-400"
        : "text-amber-300";

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background to-background p-8 shadow-xl shadow-primary/10">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          {p.avatar_url ? (
            <img src={p.avatar_url} alt={displayName} className="h-24 w-24 rounded-full ring-4 ring-primary/40" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 text-3xl font-bold ring-4 ring-primary/40">
              {displayName[0]?.toUpperCase()}
            </div>
          )}
          <div className="text-center sm:text-left">
            <p className="text-sm uppercase tracking-widest text-primary-glow">Signed in as</p>
            <h1 className="text-3xl font-bold">{displayName}</h1>
            <p className="text-muted-foreground">@{p.username}</p>
          </div>
          <a
            href="/api/auth/logout"
            className="ml-auto rounded-lg border border-border/60 bg-background/40 px-4 py-2 text-sm font-medium hover:bg-background/70"
          >
            Log out
          </a>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
          <h2 className="text-lg font-semibold">MTA Character</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Link your Discord to your in-game character using the serial from your whitelist application.
          </p>

          {p.linked_serial ? (
            <div className="mt-5 space-y-3">
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                <p className="text-xs uppercase tracking-wider text-primary-glow">Linked serial</p>
                <p className="mt-1 font-mono text-lg">{p.linked_serial}</p>
              </div>
              <button
                onClick={handleUnlink}
                disabled={busy}
                className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
              >
                Unlink character
              </button>
            </div>
          ) : (
            <form onSubmit={handleLink} className="mt-5 space-y-3">
              <label className="block text-sm font-medium">Serial</label>
              <input
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                required
                minLength={4}
                placeholder="Your MTA serial (32 characters)"
                className="w-full rounded-lg border border-border/60 bg-background/40 px-4 py-2 font-mono outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={busy || serial.trim().length < 4}
                className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110 disabled:opacity-50"
              >
                {busy ? "Linking…" : "Link character"}
              </button>
            </form>
          )}

          {msg && (
            <p className={`mt-3 text-sm ${msg.kind === "ok" ? "text-emerald-400" : "text-rose-400"}`}>{msg.text}</p>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
          <h2 className="text-lg font-semibold">Whitelist Application</h2>
          {data.application ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-semibold uppercase tracking-wide ${statusColor}`}>{data.application.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">RP Name</span>
                <span>{data.application.name_rp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">RP Age</span>
                <span>{data.application.age_rp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serial</span>
                <span className="font-mono">{data.application.serial}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted</span>
                <span>{new Date(data.application.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              {p.linked_serial
                ? "No whitelist application found for this serial."
                : "Link your serial above to see your whitelist application status."}
            </p>
          )}
          <a
            href="/whitelist"
            className="mt-6 inline-block text-sm font-medium text-primary-glow hover:underline"
          >
            Submit a new application →
          </a>
        </div>
      </div>
    </section>
  );
}
