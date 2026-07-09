import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { avatarUrl, isAdminId, loadSession } from "@/lib/account.functions";

export const DISCORD_STAFF_ROLE_ID = "1524921517136281680";

export type StaffStatus = "pending" | "approved" | "denied";

export type StaffApplication = {
  id: string;
  user_discord_id: string;
  experience: string;
  why_join: string;
  how_help: string;
  status: StaffStatus;
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
  user_username: string | null;
  user_global_name: string | null;
  user_avatar_url: string | null;
};

async function hydrateProfile(discord_id: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("discord_profiles")
    .select("discord_id, username, global_name, avatar")
    .eq("discord_id", discord_id)
    .maybeSingle();
  return data;
}

async function hydrateProfiles(ids: string[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const map = new Map<string, { username: string; global_name: string | null; avatar: string | null }>();
  if (unique.length === 0) return map;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("discord_profiles")
    .select("discord_id, username, global_name, avatar")
    .in("discord_id", unique);
  for (const p of data ?? [])
    map.set(p.discord_id, { username: p.username, global_name: p.global_name, avatar: p.avatar });
  return map;
}

function decorate(row: any, profile: { username: string; global_name: string | null; avatar: string | null } | null | undefined): StaffApplication {
  return {
    id: row.id,
    user_discord_id: row.user_discord_id,
    experience: row.experience,
    why_join: row.why_join,
    how_help: row.how_help,
    status: row.status as StaffStatus,
    decline_reason: row.decline_reason ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    user_username: profile?.username ?? null,
    user_global_name: profile?.global_name ?? null,
    user_avatar_url: profile?.avatar ? avatarUrl(row.user_discord_id, profile.avatar) : null,
  };
}

export const listMyStaffApplications = createServerFn({ method: "GET" }).handler(async (): Promise<StaffApplication[]> => {
  const session = await loadSession();
  if (!session) throw new Error("Not authenticated");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("staff_applications")
    .select("*")
    .eq("user_discord_id", session.discord_id)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const p = await hydrateProfile(session.discord_id);
  return (data ?? []).map((r) => decorate(r, p));
});

export const listStaffApplications = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ status: z.enum(["pending", "approved", "denied"]) }).parse(data))
  .handler(async ({ data }): Promise<StaffApplication[]> => {
    const session = await loadSession();
    if (!session) throw new Error("Not authenticated");
    if (!(await isAdminId(session.discord_id))) throw new Error("Administrator access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("staff_applications")
      .select("*")
      .eq("status", data.status)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    const profiles = await hydrateProfiles((rows ?? []).map((r) => r.user_discord_id));
    return (rows ?? []).map((r) => decorate(r, profiles.get(r.user_discord_id)));
  });

export const createStaffApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        experience: z.string().trim().min(5).max(4000),
        why_join: z.string().trim().min(5).max(4000),
        how_help: z.string().trim().min(5).max(4000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const session = await loadSession();
    if (!session) throw new Error("You must be logged in to submit a staff request.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("staff_applications")
      .select("id")
      .eq("user_discord_id", session.discord_id)
      .eq("status", "pending")
      .maybeSingle();
    if (existing) throw new Error("You already have a pending staff request. Wait for a decision before submitting a new one.");

    const { data: row, error } = await supabaseAdmin
      .from("staff_applications")
      .insert({
        user_discord_id: session.discord_id,
        experience: data.experience,
        why_join: data.why_join,
        how_help: data.how_help,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("You already have a pending staff request.");
      throw new Error(error.message);
    }
    return { ok: true, id: row.id };
  });

async function sendDiscordDM(userId: string, content: string) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return;
  try {
    const chRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
      method: "POST",
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient_id: userId }),
    });
    if (!chRes.ok) {
      console.error(`Staff DM channel create failed [${chRes.status}]: ${await chRes.text()}`);
      return;
    }
    const channel = (await chRes.json()) as { id: string };
    const msgRes = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!msgRes.ok) console.error(`Staff DM send failed [${msgRes.status}]: ${await msgRes.text()}`);
  } catch (e) {
    console.error("Staff DM error:", e);
  }
}

async function addStaffRole(userId: string) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return;
  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/1479830584997052489/members/${userId}/roles/${DISCORD_STAFF_ROLE_ID}`,
      { method: "PUT", headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" } },
    );
    if (!res.ok) console.error(`Staff role assign failed [${res.status}]: ${await res.text()}`);
  } catch (e) {
    console.error("Staff role error:", e);
  }
}

export const moderateStaffApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["approve", "deny"]),
        reason: z.string().trim().max(1000).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const session = await loadSession();
    if (!session) throw new Error("Not authenticated");
    if (!(await isAdminId(session.discord_id))) throw new Error("Administrator access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: app, error: fErr } = await supabaseAdmin
      .from("staff_applications")
      .select("id, user_discord_id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (fErr) throw new Error(fErr.message);
    if (!app) throw new Error("Staff request not found");

    const status: StaffStatus = data.action === "approve" ? "approved" : "denied";
    const reason = data.action === "deny" ? (data.reason?.trim() || null) : null;

    const { error } = await supabaseAdmin
      .from("staff_applications")
      .update({ status, decline_reason: reason, updated_at: new Date().toISOString() })
      .eq("id", app.id);
    if (error) throw new Error(error.message);

    if (data.action === "approve") {
      await sendDiscordDM(
        app.user_discord_id,
        "🎉 Your staff request for **Horizon Roleplay** has been **approved**! Welcome to the team.",
      );
      await addStaffRole(app.user_discord_id);
    } else {
      const msg = reason
        ? `❌ Your staff request for **Horizon Roleplay** has been **declined**.\n\n**Reason:** ${reason}`
        : "❌ Your staff request for **Horizon Roleplay** has been **declined**.";
      await sendDiscordDM(app.user_discord_id, msg);
    }

    return { ok: true, status };
  });
