import { createFileRoute } from "@tanstack/react-router";
import { buildSessionCookie, getRedirectUri, signSession } from "@/lib/session.server";

export const Route = createFileRoute("/api/auth/discord/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        if (!code) return new Response("Missing code", { status: 400 });

        const clientId = process.env.DISCORD_CLIENT_ID;
        const clientSecret = process.env.DISCORD_CLIENT_SECRET;
        if (!clientId || !clientSecret) return new Response("Discord not configured", { status: 500 });

        const redirectUri = getRedirectUri(request);

        const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
          }),
        });
        if (!tokenRes.ok) {
          const body = await tokenRes.text();
          console.error(`Discord token exchange failed [${tokenRes.status}]: ${body}`);
          return new Response("Discord token exchange failed", { status: 502 });
        }
        const { access_token } = (await tokenRes.json()) as { access_token: string };

        const userRes = await fetch("https://discord.com/api/users/@me", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        if (!userRes.ok) {
          const body = await userRes.text();
          console.error(`Discord user fetch failed [${userRes.status}]: ${body}`);
          return new Response("Discord user fetch failed", { status: 502 });
        }
        const user = (await userRes.json()) as {
          id: string;
          username: string;
          global_name?: string | null;
          avatar?: string | null;
          email?: string | null;
        };

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("discord_profiles").upsert(
          {
            discord_id: user.id,
            username: user.username,
            global_name: user.global_name ?? null,
            avatar: user.avatar ?? null,
            email: user.email ?? null,
          },
          { onConflict: "discord_id" },
        );
        if (error) {
          console.error("Profile upsert failed:", error);
          return new Response("Profile save failed", { status: 500 });
        }

        const token = await signSession({ discord_id: user.id });
        return new Response(null, {
          status: 302,
          headers: { Location: "/dashboard", "Set-Cookie": buildSessionCookie(token) },
        });
      },
    },
  },
});
