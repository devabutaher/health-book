"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAppSelector, useAppDispatch } from "@/hooks";
import { postApi } from "@/redux/api/postApi";

export function useFeedRealtime() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!userId || !accessToken) return;

    const topic = `hb-feed:${userId}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const invalidateDebounced = () => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        dispatch(postApi.util.invalidateTags(["Posts"]));
      }, 500);
    };

    channel = supabase.channel(topic, { config: { private: false } });

    channel
      .on("broadcast", { event: "POST_CREATED" }, invalidateDebounced)
      .on("broadcast", { event: "REACTION_ADDED" }, invalidateDebounced)
      .on("broadcast", { event: "REACTION_REMOVED" }, invalidateDebounced)
      .on("broadcast", { event: "REACTION_CHANGED" }, invalidateDebounced)
      .on("broadcast", { event: "FOLLOW_CHANGED" }, invalidateDebounced)
      .subscribe();

    return () => {
      clearTimeout(debounceRef.current);
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, accessToken, dispatch]);
}
