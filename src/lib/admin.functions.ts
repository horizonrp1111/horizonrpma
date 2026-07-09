import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { avatarUrl, isAdminId, loadSession } from "@/lib/account.functions";

export type AdminApplication = {
  id: string;
  discord_id: string | null;
  name_irl: string;
  age_irl: number;
  name_rp: string;
  age_rp: number;
  serial: string;
  story: string;
  status: "pending" | "approved" | "denied";
  created_at: string;
  discord_username: string | null;
  discord_global_name: string | null;
  discord_avatar_url: string | null;
};

async function requireAdmin() {
  const session = await loadSession();
  if (!session) throw new Error("Not authenticated");
  const ok = await isAdminId(session.discord_id);
  if (!ok) throw new Error("Administrator access required");
  return session;
}

async function fetchApplicationsByStatus(status: "pending" | "approved" | "denied"): Promise<AdminApplication[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: apps, error } = await supabaseAdmin
    .from("whitelist_applications")
    .select("id, discord_id, name_irl, age_irl, name_rp, age_rp, serial, story, status, created_at")
    .eq("status", status)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const ids = Array.from(new Set((apps ?? []).map((a) => a.discord_id).filter((x): x is string => !!x)));
  const profileById = new Map<string, { username: string; global_name: string | null; avatar: string | null }>();
  if (ids.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("discord_profiles")
      .select("discord_id, username, global_name, avatar")
      .in("discord_id", ids);
    for (const p of profiles ?? [])
      profileById.set(p.discord_id, { username: p.username, global_name: p.global_name, avatar: p.avatar });
  }

  return (apps ?? []).map((a) => {
    const p = a.discord_id ? profileById.get(a.discord_id) : undefined;
    return {
      ...a,
      status: a.status as AdminApplication["status"],
      discord_username: p?.username ?? null,
      discord_global_name: p?.global_name ?? null,
      discord_avatar_url: a.discord_id && p?.avatar ? avatarUrl(a.discord_id, p.avatar) : null,
    };
  });
}

export const listApplications = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ status: z.enum(["pending", "approved", "denied"]) }).parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    return fetchApplicationsByStatus(data.status);
  });

const DISCORD_GUILD_ID = "1479830584997052489";
const DISCORD_APPROVED_ROLE_ID = "1479877357463666950";
const DISCORD_REJECTED_ROLE_ID = "1521613631878332526";
const DISCORD_REVOKED_ROLE_ID = "1523668523904405727";
const DISCORD_ADMIN_ROLE_ID = "1479853701664477295";

async function sendDiscordDM(userId: string, content: string) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.warn("DISCORD_BOT_TOKEN not set — skipping DM");
    return;
  }
  try {
    const chRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
      method: "POST",
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient_id: userId }),
    });
    if (!chRes.ok) {
      console.error(`Discord DM channel create failed [${chRes.status}]: ${await chRes.text()}`);
      return;
    }
    const channel = (await chRes.json()) as { id: string };
    const msgRes = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!msgRes.ok) {
      console.error(`Discord DM send failed [${msgRes.status}]: ${await msgRes.text()}`);
    }
  } catch (e) {
    console.error("Discord DM error:", e);
  }
}

async function updateDiscordRoles(userId: string, addRoles: string[], removeRoles: string[]) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.warn("DISCORD_BOT_TOKEN not set — skipping role assignment");
    return;
  }
  const headers = { Authorization: `Bot ${token}`, "Content-Type": "application/json" };
  try {
    for (const roleId of addRoles) {
      const res = await fetch(
        `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${userId}/roles/${roleId}`,
        { method: "PUT", headers },
      );
      if (!res.ok) console.error(`Discord role add failed [${res.status}]: ${await res.text()}`);
    }
    for (const roleId of removeRoles) {
      const res = await fetch(
        `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${userId}/roles/${roleId}`,
        { method: "DELETE", headers },
      );
      if (!res.ok && res.status !== 404)
        console.error(`Discord role remove failed [${res.status}]: ${await res.text()}`);
    }
  } catch (e) {
    console.error("Discord role update error:", e);
  }
}

async function assignDiscordRole(userId: string, action: "approve" | "deny") {
  const add = action === "approve" ? DISCORD_APPROVED_ROLE_ID : DISCORD_REJECTED_ROLE_ID;
  const remove = action === "approve" ? DISCORD_REJECTED_ROLE_ID : DISCORD_APPROVED_ROLE_ID;
  await updateDiscordRoles(userId, [add], [remove, DISCORD_REVOKED_ROLE_ID]);
}

export const moderateApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), action: z.enum(["approve", "deny"]) }).parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const status = data.action === "approve" ? "approved" : "denied";

    const { data: app, error: fetchErr } = await supabaseAdmin
      .from("whitelist_applications")
      .select("discord_id")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);

    const { error } = await supabaseAdmin
      .from("whitelist_applications")
      .update({ status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    if (app?.discord_id) {
      const { data: adminProfile } = await supabaseAdmin
        .from("discord_profiles")
        .select("username, global_name")
        .eq("discord_id", admin.discord_id)
        .maybeSingle();
      const adminName = adminProfile?.global_name || adminProfile?.username || "an admin";
      const message =
        data.action === "approve"
          ? `rak t9blti mn taraf ${adminName} dkhol o mar7ba bik 92.119.165.177:9527`
          : `lil2assaf trfadti la kan 3ndk chi so2al 3la rafd 7ol ticket f server discord`;
      await sendDiscordDM(app.discord_id, message);
      await assignDiscordRole(app.discord_id, data.action);
    }

    return { ok: true, status };
  });

export const revokeWhitelist = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: app, error: fetchErr } = await supabaseAdmin
      .from("whitelist_applications")
      .select("discord_id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!app) throw new Error("Application not found");
    if (app.status !== "approved") throw new Error("Only whitelisted members can be revoked.");

    const { error: delErr } = await supabaseAdmin
      .from("whitelist_applications")
      .delete()
      .eq("id", data.id);
    if (delErr) throw new Error(delErr.message);

    if (app.discord_id) {
      await supabaseAdmin
        .from("discord_profiles")
        .update({ linked_serial: null })
        .eq("discord_id", app.discord_id);
      await sendDiscordDM(
        app.discord_id,
        `tm sa7b mnk lwhitelist. la kan 3ndk chi so2al 7ol ticket f server discord.`,
      );
      await updateDiscordRoles(
        app.discord_id,
        [DISCORD_REVOKED_ROLE_ID],
        [DISCORD_APPROVED_ROLE_ID, DISCORD_REJECTED_ROLE_ID],
      );
    }

    return { ok: true };
  });

export type AdminMember = {
  discord_id: string;
  created_at: string;
  username: string | null;
  global_name: string | null;
  avatar_url: string | null;
};

export const listAdmins = createServerFn({ method: "GET" }).handler(async (): Promise<AdminMember[]> => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: rows, error } = await supabaseAdmin
    .from("admin_users")
    .select("discord_id, created_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const ids = (rows ?? []).map((r) => r.discord_id);
  const profileById = new Map<string, { username: string; global_name: string | null; avatar: string | null }>();
  if (ids.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("discord_profiles")
      .select("discord_id, username, global_name, avatar")
      .in("discord_id", ids);
    for (const p of profiles ?? [])
      profileById.set(p.discord_id, { username: p.username, global_name: p.global_name, avatar: p.avatar });
  }

  return (rows ?? []).map((r) => {
    const p = profileById.get(r.discord_id);
    return {
      discord_id: r.discord_id,
      created_at: r.created_at,
      username: p?.username ?? null,
      global_name: p?.global_name ?? null,
      avatar_url: p?.avatar ? avatarUrl(r.discord_id, p.avatar) : null,
    };
  });
});

export const grantAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ discord_id: z.string().trim().regex(/^\d{5,32}$/, "Enter a valid Discord user ID (numeric)") }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("admin_users")
      .upsert({ discord_id: data.discord_id }, { onConflict: "discord_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revokeAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ discord_id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const session = await requireAdmin();
    if (data.discord_id === session.discord_id) throw new Error("You cannot revoke your own admin access.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("admin_users").delete().eq("discord_id", data.discord_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

