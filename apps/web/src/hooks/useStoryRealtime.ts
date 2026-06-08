"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppSelector, useAppDispatch } from "@/hooks";
import { storiesApi } from "@/redux/api/storiesApi";

export function useStoryRealtime() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    const topic = "hb-stories";
    let channel: ReturnType<typeof supabase.channel> | null = null;

    channel = supabase.channel(topic, { config: { private: false } });

    channel
      .on("broadcast", { event: "STORY_CREATED" }, () => {
        dispatch(storiesApi.util.invalidateTags(["Stories"]));
      })
      .on("broadcast", { event: "STORY_DELETED" }, () => {
        dispatch(storiesApi.util.invalidateTags(["Stories"]));
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [accessToken, dispatch]);
}
