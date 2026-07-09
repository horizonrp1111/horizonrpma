import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { avatarUrl, isAdminId, loadSession } from "@/lib/account.functions";

export type TicketSummary = {
  id: string;
  subject: string;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
  user_discord_id: string;
  user_username: string | null;
  user_global_name: string | null;
  user_avatar_url: string | null;
  message_count: number;
};

export type TicketMessage = {
  id: string;
  ticket_id: string;
  author_discord_id: string;
  is_admin: boolean;
  body: string;
  created_at: string;
  author_username: string | null;
  author_global_name: string | null;
  author_avatar_url: string | null;
};

export type TicketDetail = {
  id: string;
  subject: string;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
  user_discord_id: string;
  user_username: string | null;
  user_global_name: string | null;
  user_avatar_url: string | null;
  messages: TicketMessage[];
  viewer_is_admin: boolean;
  viewer_discord_id: string;
};

async function hydrateProfiles(discordIds: string[]) {
  const ids = Array.from(new Set(discordIds.filter(Boolean)));
  const map = new Map<string, { username: string; global_name: string | null; avatar: string | null }>();
  if (ids.length === 0) return map;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("discord_profiles")
    .select("discord_id, username, global_name, avatar")
    .in("discord_id", ids);
  for (const p of data ?? [])
    map.set(p.discord_id, { username: p.username, global_name: p.global_name, avatar: p.avatar });
  return map;
}

export const listMyTickets = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ status: z.enum(["open", "closed"]) }).parse(data),
  )
  .handler(async ({ data }): Promise<TicketSummary[]> => {
    const session = await loadSession();
    if (!session) throw new Error("Not authenticated");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("support_tickets")
      .select("id, subject, status, created_at, updated_at, user_discord_id")
      .eq("user_discord_id", session.discord_id)
      .eq("status", data.status)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    const profiles = await hydrateProfiles([session.discord_id]);
    const p = profiles.get(session.discord_id);
    const ids = (rows ?? []).map((r) => r.id);
    const counts = await countMessages(ids);
    return (rows ?? []).map((r) => ({
      ...r,
      status: r.status as "open" | "closed",
      user_username: p?.username ?? null,
      user_global_name: p?.global_name ?? null,
      user_avatar_url: p?.avatar ? avatarUrl(session.discord_id, p.avatar) : null,
      message_count: counts.get(r.id) ?? 0,
    }));
  });

export const listAllTickets = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ status: z.enum(["open", "closed"]) }).parse(data),
  )
  .handler(async ({ data }): Promise<TicketSummary[]> => {
    const session = await loadSession();
    if (!session) throw new Error("Not authenticated");
    if (!(await isAdminId(session.discord_id))) throw new Error("Administrator access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("support_tickets")
      .select("id, subject, status, created_at, updated_at, user_discord_id")
      .eq("status", data.status)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    const profiles = await hydrateProfiles((rows ?? []).map((r) => r.user_discord_id));
    const ids = (rows ?? []).map((r) => r.id);
    const counts = await countMessages(ids);
    return (rows ?? []).map((r) => {
      const p = profiles.get(r.user_discord_id);
      return {
        ...r,
        status: r.status as "open" | "closed",
        user_username: p?.username ?? null,
        user_global_name: p?.global_name ?? null,
        user_avatar_url: p?.avatar ? avatarUrl(r.user_discord_id, p.avatar) : null,
        message_count: counts.get(r.id) ?? 0,
      };
    });
  });

async function countMessages(ticketIds: string[]) {
  const counts = new Map<string, number>();
  if (ticketIds.length === 0) return counts;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("support_ticket_messages")
    .select("ticket_id")
    .in("ticket_id", ticketIds);
  for (const row of data ?? []) counts.set(row.ticket_id, (counts.get(row.ticket_id) ?? 0) + 1);
  return counts;
}

export const getTicket = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<TicketDetail> => {
    const session = await loadSession();
    if (!session) throw new Error("Not authenticated");
    const admin = await isAdminId(session.discord_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ticket, error } = await supabaseAdmin
      .from("support_tickets")
      .select("id, subject, status, created_at, updated_at, user_discord_id")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!ticket) throw new Error("Ticket not found");
    if (!admin && ticket.user_discord_id !== session.discord_id) throw new Error("Not allowed");

    const { data: messages, error: mErr } = await supabaseAdmin
      .from("support_ticket_messages")
      .select("id, ticket_id, author_discord_id, is_admin, body, created_at")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });
    if (mErr) throw new Error(mErr.message);

    const profiles = await hydrateProfiles([
      ticket.user_discord_id,
      ...(messages ?? []).map((m) => m.author_discord_id),
    ]);
    const owner = profiles.get(ticket.user_discord_id);

    return {
      ...ticket,
      status: ticket.status as "open" | "closed",
      user_username: owner?.username ?? null,
      user_global_name: owner?.global_name ?? null,
      user_avatar_url: owner?.avatar ? avatarUrl(ticket.user_discord_id, owner.avatar) : null,
      messages: (messages ?? []).map((m) => {
        const p = profiles.get(m.author_discord_id);
        return {
          ...m,
          author_username: p?.username ?? null,
          author_global_name: p?.global_name ?? null,
          author_avatar_url: p?.avatar ? avatarUrl(m.author_discord_id, p.avatar) : null,
        };
      }),
      viewer_is_admin: admin,
      viewer_discord_id: session.discord_id,
    };
  });

export const createTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        subject: z.string().trim().min(3).max(120),
        body: z.string().trim().min(5).max(4000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const session = await loadSession();
    if (!session) throw new Error("You must be logged in to open a ticket.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("support_tickets")
      .select("id")
      .eq("user_discord_id", session.discord_id)
      .eq("status", "open")
      .maybeSingle();
    if (existing) throw new Error("You already have an open ticket. Close it before opening a new one.");

    const { data: ticket, error } = await supabaseAdmin
      .from("support_tickets")
      .insert({ user_discord_id: session.discord_id, subject: data.subject })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("You already have an open ticket.");
      throw new Error(error.message);
    }

    const { error: mErr } = await supabaseAdmin.from("support_ticket_messages").insert({
      ticket_id: ticket.id,
      author_discord_id: session.discord_id,
      is_admin: false,
      body: data.body,
    });
    if (mErr) throw new Error(mErr.message);

    return { ok: true, id: ticket.id };
  });

export const replyToTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), body: z.string().trim().min(1).max(4000) }).parse(data),
  )
  .handler(async ({ data }) => {
    const session = await loadSession();
    if (!session) throw new Error("Not authenticated");
    const admin = await isAdminId(session.discord_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ticket, error } = await supabaseAdmin
      .from("support_tickets")
      .select("id, user_discord_id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!ticket) throw new Error("Ticket not found");
    if (!admin && ticket.user_discord_id !== session.discord_id) throw new Error("Not allowed");
    if (ticket.status === "closed") throw new Error("This ticket is closed.");

    const { error: mErr } = await supabaseAdmin.from("support_ticket_messages").insert({
      ticket_id: ticket.id,
      author_discord_id: session.discord_id,
      is_admin: admin,
      body: data.body,
    });
    if (mErr) throw new Error(mErr.message);

    await supabaseAdmin.from("support_tickets").update({ updated_at: new Date().toISOString() }).eq("id", ticket.id);
    return { ok: true };
  });

export const setTicketStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["open", "closed"]) }).parse(data),
  )
  .handler(async ({ data }) => {
    const session = await loadSession();
    if (!session) throw new Error("Not authenticated");
    const admin = await isAdminId(session.discord_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ticket, error } = await supabaseAdmin
      .from("support_tickets")
      .select("id, user_discord_id")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!ticket) throw new Error("Ticket not found");
    if (!admin && ticket.user_discord_id !== session.discord_id) throw new Error("Not allowed");

    const { error: uErr } = await supabaseAdmin
      .from("support_tickets")
      .update({ status: data.status })
      .eq("id", ticket.id);
    if (uErr) throw new Error(uErr.message);
    return { ok: true };
  });
