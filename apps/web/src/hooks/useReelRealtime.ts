"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppSelector, useAppDispatch } from "@/hooks";
import { reelsApi } from "@/redux/api/reelsApi";

export function useReelRealtime(reelId: string | null) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);

  useEffect(() => {
    if (!reelId || !accessToken) return;

    const topic = `hb-reel:${reelId}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    channel = supabase.channel(topic, { config: { private: false } });

    channel
      .on("broadcast", { event: "REEL_LIKED" }, () => {
        dispatch(reelsApi.util.invalidateTags([{ type: "Reel", id: reelId }]));
      })
      .on("broadcast", { event: "REEL_UNLIKED" }, () => {
        dispatch(reelsApi.util.invalidateTags([{ type: "Reel", id: reelId }]));
      })
      .on("broadcast", { event: "REEL_COMMENTED" }, () => {
        dispatch(reelsApi.util.invalidateTags([{ type: "Reel", id: reelId }]));
      })
      .on("broadcast", { event: "REEL_UPDATED" }, () => {
        dispatch(reelsApi.util.invalidateTags([{ type: "Reel", id: reelId }]));
      })
      .on("broadcast", { event: "REEL_DELETED" }, () => {
        dispatch(reelsApi.util.invalidateTags([{ type: "Reel", id: reelId }, "Reels"]));
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [reelId, accessToken, dispatch]);
}
