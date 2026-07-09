import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { avatarUrl, isAdminId, loadSession } from "@/lib/account.functions";

export type StaffApplication = {
  id: string;
  user_discord_id: string;
  experience: string;
  why_join: string;
  how_help: string;
  status: "open" | "closed";
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
    ...row,
    status: row.status as "open" | "closed",
    user_username: profile?.username ?? null,
    user_global_name: profile?.global_name ?? null,
    user_avatar_url: profile?.avatar ? avatarUrl(row.user_discord_id, profile.avatar) : null,
  };
}

export const getStaffRequestsOpen = createServerFn({ method: "GET" }).handler(async (): Promise<boolean> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("site_settings").select("staff_requests_open").eq("id", true).maybeSingle();
  return !!data?.staff_requests_open;
});

export const setStaffRequestsOpen = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ open: z.boolean() }).parse(data))
  .handler(async ({ data }) => {
    const session = await loadSession();
    if (!session) throw new Error("Not authenticated");
    if (!(await isAdminId(session.discord_id))) throw new Error("Administrator access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .update({ staff_requests_open: data.open, updated_at: new Date().toISOString() })
      .eq("id", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


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
  .inputValidator((data: unknown) => z.object({ status: z.enum(["open", "closed"]) }).parse(data))
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
      .eq("status", "open")
      .maybeSingle();
    if (existing) throw new Error("You already have an open staff request. Wait until it is closed before opening a new one.");

    const { data: row, error } = await supabaseAdmin
      .from("staff_applications")
      .insert({
        user_discord_id: session.discord_id,
        experience: data.experience,
        why_join: data.why_join,
        how_help: data.how_help,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("You already have an open staff request.");
      throw new Error(error.message);
    }
    return { ok: true, id: row.id };
  });

export const setStaffApplicationStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["open", "closed"]) }).parse(data),
  )
  .handler(async ({ data }) => {
    const session = await loadSession();
    if (!session) throw new Error("Not authenticated");
    if (!(await isAdminId(session.discord_id))) throw new Error("Administrator access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("staff_applications")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
