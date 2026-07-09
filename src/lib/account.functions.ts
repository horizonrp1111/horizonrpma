import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SessionData } from "@/lib/session.server";

export type DashboardData = {
  profile: {
    discord_id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
    email: string | null;
    linked_serial: string | null;
    avatar_url: string | null;
    is_admin: boolean;
  } | null;
  application: {
    name_rp: string;
    age_rp: number;
    serial: string;
    status: string;
    created_at: string;
  } | null;
};

export async function loadSession(): Promise<SessionData | null> {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const { readSessionCookie, verifySession } = await import("@/lib/session.server");
  const cookie = getRequestHeader("cookie") ?? null;
  const token = readSessionCookie(cookie);
  return verifySession(token);
}

export function avatarUrl(discord_id: string, avatar: string | null): string | null {
  if (!avatar) return null;
  const ext = avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${discord_id}/${avatar}.${ext}?size=256`;
}

export async function isAdminId(discord_id: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("discord_id")
    .eq("discord_id", discord_id)
    .maybeSingle();
  return !!data;
}

export const getDashboard = createServerFn({ method: "GET" }).handler(async (): Promise<DashboardData> => {
  const session = await loadSession();
  if (!session) return { profile: null, application: null };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profile } = await supabaseAdmin
    .from("discord_profiles")
    .select("discord_id, username, global_name, avatar, email, linked_serial")
    .eq("discord_id", session.discord_id)
    .maybeSingle();

  if (!profile) return { profile: null, application: null };

  const is_admin = await isAdminId(profile.discord_id);

  // Try by explicit link first, else fall back to any application submitted by this Discord account.
  let application: DashboardData["application"] = null;
  if (profile.linked_serial) {
    const { data: app } = await supabaseAdmin
      .from("whitelist_applications")
      .select("name_rp, age_rp, serial, status, created_at")
      .eq("serial", profile.linked_serial)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    application = app ?? null;
  }
  if (!application) {
    const { data: app } = await supabaseAdmin
      .from("whitelist_applications")
      .select("name_rp, age_rp, serial, status, created_at")
      .eq("discord_id", profile.discord_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    application = app ?? null;
  }

  return {
    profile: { ...profile, avatar_url: avatarUrl(profile.discord_id, profile.avatar), is_admin },
    application,
  };
});

export const linkSerial = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ serial: z.string().trim().min(4).max(64) }).parse(data))
  .handler(async ({ data }) => {
    const session = await loadSession();
    if (!session) throw new Error("Not authenticated");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: app } = await supabaseAdmin
      .from("whitelist_applications")
      .select("id, discord_id")
      .eq("serial", data.serial)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!app) throw new Error("No whitelist application found for this serial. Submit an application first.");
    if (app.discord_id && app.discord_id !== session.discord_id)
      throw new Error("This serial is already linked to another Discord account.");

    const { error: uErr } = await supabaseAdmin
      .from("discord_profiles")
      .update({ linked_serial: data.serial })
      .eq("discord_id", session.discord_id);
    if (uErr) throw new Error(uErr.message);

    await supabaseAdmin
      .from("whitelist_applications")
      .update({ discord_id: session.discord_id })
      .eq("id", app.id);

    return { ok: true };
  });

export const unlinkSerial = createServerFn({ method: "POST" }).handler(async () => {
  const session = await loadSession();
  if (!session) throw new Error("Not authenticated");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("discord_profiles").update({ linked_serial: null }).eq("discord_id", session.discord_id);
  return { ok: true };
});
