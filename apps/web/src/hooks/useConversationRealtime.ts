"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppSelector, useAppDispatch } from "@/hooks";
import { messagingApi } from "@/redux/api/messagingApi";

export function useConversationRealtime() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const userId = useAppSelector((s) => s.auth.user?.id);

  useEffect(() => {
    if (!userId || !accessToken) return;

    const topic = `hb-conversations:${userId}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    channel = supabase.channel(topic, { config: { private: false } });

    channel
      .on("broadcast", { event: "CONVERSATION_UPDATED" }, () => {
        dispatch(messagingApi.util.invalidateTags(["Conversations", "MessageUnread"]));
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, accessToken, dispatch]);
}
