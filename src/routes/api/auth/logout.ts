import { createFileRoute } from "@tanstack/react-router";
import { buildClearCookie } from "@/lib/session.server";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      GET: async () =>
        new Response(null, {
          status: 302,
          headers: { Location: "/", "Set-Cookie": buildClearCookie() },
        }),
    },
  },
});
