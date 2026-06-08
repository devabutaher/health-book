"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppSelector, useAppDispatch } from "@/hooks";
import { userApi } from "@/redux/api/userApi";

export function useUserRealtime() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const userId = useAppSelector((s) => s.auth.user?.id);

  useEffect(() => {
    if (!userId || !accessToken) return;

    const topic = `hb-user:${userId}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    channel = supabase.channel(topic, { config: { private: false } });

    channel
      .on("broadcast", { event: "NEW_FOLLOWER" }, () => {
        dispatch(userApi.util.invalidateTags(["Profile", "Followers", "Following"]));
      })
      .on("broadcast", { event: "UNFOLLOWED" }, () => {
        dispatch(userApi.util.invalidateTags(["Profile", "Followers", "Following"]));
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, accessToken, dispatch]);
}
