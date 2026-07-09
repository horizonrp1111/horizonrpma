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

export const moderateApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), action: z.enum(["approve", "deny"]) }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const status = data.action === "approve" ? "approved" : "denied";
    const { error } = await supabaseAdmin
      .from("whitelist_applications")
      .update({ status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, status };
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

