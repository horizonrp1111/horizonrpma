import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  nameIrl: z.string().trim().min(2).max(80),
  ageIrl: z.coerce.number().int().min(10).max(99),
  nameRp: z.string().trim().min(2).max(80),
  ageRp: z.coerce.number().int().min(15).max(99),
  serial: z.string().trim().min(4).max(64),
  story: z.string().trim().min(20).max(4000),
});

export const submitWhitelist = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: dbErr } = await supabaseAdmin.from("whitelist_applications").insert({
      name_irl: data.nameIrl,
      age_irl: data.ageIrl,
      name_rp: data.nameRp,
      age_rp: data.ageRp,
      serial: data.serial,
      story: data.story,
    });
    if (dbErr) {
      console.error("Whitelist DB insert failed:", dbErr);
      throw new Error("Failed to save application");
    }

    const url = process.env.WHITELIST_WEBHOOK_URL;
    if (url) {
      const payload = {
        username: "Horizon RP Whitelist",
        embeds: [
          {
            title: "New Whitelist Application",
            color: 0x7a2df0,
            fields: [
              { name: "Name IRL", value: data.nameIrl, inline: true },
              { name: "Age IRL", value: String(data.ageIrl), inline: true },
              { name: "Name RP", value: data.nameRp, inline: true },
              { name: "Age RP", value: String(data.ageRp), inline: true },
              { name: "Serial", value: `\`${data.serial}\``, inline: false },
              { name: "Story", value: data.story.slice(0, 1024), inline: false },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error(`Discord webhook failed [${res.status}]: ${body}`);
      }
    }

    return { ok: true };
  });
