"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppSelector } from "@/hooks";
import { setOnlineUsers, addOnlineUser, removeOnlineUser } from "@/lib/onlineStore";

export function usePresenceRealtime() {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const userId = useAppSelector((s) => s.auth.user?.id);

  useEffect(() => {
    if (!accessToken || !userId) return;

    const channel = supabase.channel("online-users", {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineUsers(Object.keys(state));
      })
      .on("presence", { event: "join" }, ({ key }) => {
        addOnlineUser(key);
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        removeOnlineUser(key);
      });

    ;(async () => {
      try {
        await supabase.realtime.setAuth(accessToken);
      } catch {
        return;
      }

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ onlineAt: new Date().toISOString() });
        }
      });
    })();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      removeOnlineUser(userId);
    };
  }, [accessToken, userId]);
}
