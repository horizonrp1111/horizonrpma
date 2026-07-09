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

export type MtaStatus =
  | { online: true; name: string; gamemode: string; map: string; players: number; max: number }
  | { online: false; reason: string };

export const getMtaStatus = createServerFn({ method: "GET" }).handler(async (): Promise<MtaStatus> => {
  await requireAdmin();
  const target = "92.119.165.177:9527";
  try {
    const res = await fetch("https://master.mtasa.com/ase/mta/", {
      headers: { "User-Agent": "HorizonRP-Admin/1.0" },
    });
    if (!res.ok) return { online: false, reason: `Master list error ${res.status}` };
    const text = await res.text();
    // Master list returns records; look for our IP:port anywhere in a line.
    for (const raw of text.split(/\r?\n/)) {
      if (!raw.includes(target)) continue;
      // Fields are pipe-separated with variable layout across mirrors; extract heuristically.
      const parts = raw.split("|").map((s) => s.trim());
      const nameIdx = parts.findIndex((p) => p && !p.includes(target));
      const name = parts[nameIdx] ?? "Horizon Roleplay";
      // players/max often appears as "N/M"
      const pm = raw.match(/(\d+)\s*\/\s*(\d+)/);
      const players = pm ? Number(pm[1]) : 0;
      const max = pm ? Number(pm[2]) : 0;
      const gamemode = parts[nameIdx + 1] ?? "";
      const map = parts[nameIdx + 2] ?? "";
      return { online: true, name, gamemode, map, players, max };
    }
    return { online: false, reason: "Server not listed on the MTA master list right now." };
  } catch (err) {
    return { online: false, reason: err instanceof Error ? err.message : "Unknown error" };
  }
});
