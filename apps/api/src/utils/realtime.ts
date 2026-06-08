import { supabase } from "../lib/supabase";

const MAX_RETRIES = 2;

export async function broadcastRealtime(
  channelName: string,
  event: string,
  payload: Record<string, unknown>,
  retries = MAX_RETRIES,
) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const channel = supabase.channel(channelName);
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("timeout")), 3000);
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            clearTimeout(t);
            resolve();
          }
          if (status === "CHANNEL_ERROR") {
            clearTimeout(t);
            reject(new Error("channel_error"));
          }
        });
      });
      await channel.send({ type: "broadcast", event, payload });
      channel.unsubscribe();
      return;
    } catch (err) {
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      console.error(
        `[realtime] broadcast failed on ${channelName}:${event} after ${retries + 1} attempts`,
        err,
      );
    }
  }
}
