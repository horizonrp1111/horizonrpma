import { createFileRoute } from "@tanstack/react-router";
import { getRedirectUri } from "@/lib/session.server";

export const Route = createFileRoute("/api/auth/discord")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = process.env.DISCORD_CLIENT_ID;
        if (!clientId) return new Response("Discord not configured", { status: 500 });

        const redirectUri = getRedirectUri(request);
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: "identify email",
          prompt: "consent",
        });
        return new Response(null, {
          status: 302,
          headers: { Location: `https://discord.com/oauth2/authorize?${params.toString()}` },
        });
      },
    },
  },
});
