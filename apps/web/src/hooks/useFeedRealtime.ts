"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppSelector, useAppDispatch } from "@/hooks";
import { postApi } from "@/redux/api/postApi";

export function useFeedRealtime() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const userId = useAppSelector((s) => s.auth.user?.id);

  useEffect(() => {
    if (!userId || !accessToken) return;

    const topic = `hb-feed:${userId}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    channel = supabase.channel(topic, { config: { private: false } });

    channel
      .on("broadcast", { event: "POST_CREATED" }, () => {
        dispatch(postApi.util.invalidateTags(["Feed"]));
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, accessToken, dispatch]);
}
