import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getDashboard } from "@/lib/account.functions";
import {
  createTicket,
  getTicket,
  listAllTickets,
  listMyTickets,
  replyToTicket,
  setTicketStatus,
  type TicketSummary,
  type TicketDetail,
} from "@/lib/tickets.functions";

const meOptions = queryOptions({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Horizon Roleplay" },
      { name: "description", content: "Open a support ticket for Horizon Roleplay staff." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(meOptions),
  component: SupportPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">Support error</h1>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
    </div>
  ),
});

type View = { kind: "list"; status: "open" | "closed" } | { kind: "new" } | { kind: "detail"; id: string };

function SupportPage() {
  const { data: me } = useSuspenseQuery(meOptions);
  const [view, setView] = useState<View>({ kind: "list", status: "open" });

  if (!me.profile) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="animate-title-shimmer text-5xl font-black">SUPPORT</h1>
        <p className="mt-6 text-muted-foreground">
          Log in with your Discord account to open a support ticket.
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

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary-glow">Support</p>
          <h1 className="text-4xl font-black">Tickets</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Signed in as {me.profile.global_name || me.profile.username}
        </p>
      </div>

      {view.kind === "detail" ? (
        <TicketView id={view.id} onBack={() => setView({ kind: "list", status: "open" })} />
      ) : view.kind === "new" ? (
        <NewTicket onDone={(id) => setView({ kind: "detail", id })} onCancel={() => setView({ kind: "list", status: "open" })} />
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => setView({ kind: "list", status: "open" })}
              className={tabCls(view.status === "open")}
            >
              Open tickets
            </button>
            <button
              onClick={() => setView({ kind: "new" })}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110"
            >
              + New ticket
            </button>
          </div>
          <TicketsList
            mode="mine"
            status={view.status}
            onOpen={(id) => setView({ kind: "detail", id })}
          />
        </>
      )}
    </section>
  );
}

function tabCls(active: boolean) {
  return `rounded-lg px-4 py-2 text-sm font-semibold transition ${
    active
      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
      : "border border-border/60 bg-card/40 hover:bg-card/70"
  }`;
}

function NewTicket({ onDone, onCancel }: { onDone: (id: string) => void; onCancel: () => void }) {
  const create = useServerFn(createTicket);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await create({ data: { subject, body } });
      onDone(res.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-border/60 bg-card/60 p-8 backdrop-blur-sm">
      <h2 className="text-2xl font-bold">Open a new ticket</h2>
      <p className="text-sm text-muted-foreground">You can only have one open ticket at a time.</p>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Subject</label>
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={120}
          placeholder="Short summary of your issue"
          className="w-full rounded-lg border border-border bg-input/40 px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Message</label>
        <textarea
          required
          rows={7}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={4000}
          placeholder="Describe your issue in detail"
          className="w-full rounded-lg border border-border bg-input/40 px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>
      {err && <p className="rounded-lg border border-destructive/60 bg-destructive/10 px-4 py-2 text-sm text-destructive-foreground">{err}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-lg py-3 font-semibold text-primary-foreground disabled:opacity-60"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
        >
          {busy ? "Sending..." : "Open ticket"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-border/60 px-6 py-3 hover:bg-card/60">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function TicketsList({
  mode,
  status,
  onOpen,
}: {
  mode: "mine" | "all";
  status: "open" | "closed";
  onOpen: (id: string) => void;
}) {
  const loadMine = useServerFn(listMyTickets);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tickets", mode, status],
    queryFn: () => loadMine({ data: { status } }),
    enabled: mode === "mine",
  });

  if (isLoading) return <p className="mt-8 text-muted-foreground">Loading…</p>;
  if (isError) return <p className="mt-8 text-rose-400">{(error as Error).message}</p>;
  if (!data || data.length === 0)
    return (
      <p className="mt-8 rounded-xl border border-border/60 bg-card/40 p-8 text-center text-muted-foreground">
        No {status} tickets.
      </p>
    );

  return (
    <ul className="mt-8 grid gap-3">
      {data.map((t) => (
        <TicketRow key={t.id} t={t} showUser={mode === "all"} onOpen={() => onOpen(t.id)} />
      ))}
    </ul>
  );
}

function TicketRow({ t, showUser, onOpen }: { t: TicketSummary; showUser: boolean; onOpen: () => void }) {
  const badge = t.status === "open" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-slate-500/20 text-slate-300 border-slate-500/40";
  return (
    <li>
      <button
        onClick={onOpen}
        className="w-full rounded-xl border border-border/60 bg-card/50 p-4 text-left hover:border-primary/50 hover:bg-card/70"
      >
        <div className="flex flex-wrap items-center gap-3">
          {showUser && (
            t.user_avatar_url ? (
              <img src={t.user_avatar_url} alt="" className="h-10 w-10 rounded-full ring-2 ring-primary/40" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold">
                {(t.user_global_name || t.user_username || "?")[0]?.toUpperCase()}
              </div>
            )
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{t.subject}</p>
              <span className={`rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide ${badge}`}>{t.status}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {showUser && (
                <>
                  {t.user_global_name || t.user_username || "unknown"} ·{" "}
                </>
              )}
              {t.message_count} message{t.message_count === 1 ? "" : "s"} · Updated {new Date(t.updated_at).toLocaleString()}
            </p>
          </div>
        </div>
      </button>
    </li>
  );
}

export function TicketView({ id, onBack }: { id: string; onBack: () => void }) {
  const qc = useQueryClient();
  const load = useServerFn(getTicket);
  const reply = useServerFn(replyToTicket);
  const setStatus = useServerFn(setTicketStatus);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => load({ data: { id } }),
  });
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await reply({ data: { id, body } });
      setBody("");
      await refetch();
      await qc.invalidateQueries({ queryKey: ["tickets"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(next: "open" | "closed") {
    setBusy(true);
    try {
      await setStatus({ data: { id, status: next } });
      await refetch();
      await qc.invalidateQueries({ queryKey: ["tickets"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <p className="mt-8 text-muted-foreground">Loading…</p>;
  if (isError) return <p className="mt-8 text-rose-400">{(error as Error).message}</p>;
  if (!data) return null;
  const t: TicketDetail = data;
  const canReply = t.status === "open";

  return (
    <div className="mt-6">
      <button onClick={onBack} className="mb-4 text-sm text-muted-foreground hover:text-foreground">← Back</button>
      <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">{t.subject}</h2>
            <p className="text-xs text-muted-foreground">
              Opened by {t.user_global_name || t.user_username || t.user_discord_id} · {new Date(t.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${
                t.status === "open"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-slate-500/20 text-slate-300 border-slate-500/40"
              }`}
            >
              {t.status}
            </span>
            {t.status === "open" ? (
              <button
                onClick={() => toggleStatus("closed")}
                disabled={busy}
                className="rounded-lg border border-border/60 px-3 py-1.5 text-sm hover:bg-background/60 disabled:opacity-50"
              >
                Close ticket
              </button>
            ) : (
              t.viewer_is_admin && (
                <button
                  onClick={() => toggleStatus("open")}
                  disabled={busy}
                  className="rounded-lg border border-border/60 px-3 py-1.5 text-sm hover:bg-background/60 disabled:opacity-50"
                >
                  Reopen
                </button>
              )
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {t.messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl border p-4 ${
                m.is_admin
                  ? "border-primary/50 bg-primary/10"
                  : "border-border/60 bg-background/40"
              }`}
            >
              <div className="flex items-center gap-3">
                {m.author_avatar_url ? (
                  <img src={m.author_avatar_url} alt="" className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold">
                    {(m.author_global_name || m.author_username || "?")[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {m.author_global_name || m.author_username || m.author_discord_id}
                    {m.is_admin && (
                      <span className="ml-2 rounded-full border border-amber-400/50 bg-amber-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-200">
                        Staff
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{m.body}</p>
            </div>
          ))}
        </div>

        {canReply ? (
          <form onSubmit={send} className="mt-6 space-y-3">
            <textarea
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={4000}
              placeholder="Write a reply…"
              className="w-full rounded-lg border border-border bg-input/40 px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
            />
            {err && <p className="text-sm text-rose-400">{err}</p>}
            <button
              type="submit"
              disabled={busy || !body.trim()}
              className="rounded-lg bg-primary px-5 py-2 font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send reply"}
            </button>
          </form>
        ) : (
          <p className="mt-6 rounded-lg border border-border/60 bg-background/40 p-4 text-center text-sm text-muted-foreground">
            This ticket is closed.
          </p>
        )}
      </div>
    </div>
  );
}
