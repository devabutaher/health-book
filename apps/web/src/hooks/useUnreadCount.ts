"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { notificationApi } from "@/redux/api/notificationApi";
import { useSound } from "./useSound";

const NOTIF_SOUND_MAP: Record<string, Parameters<ReturnType<typeof useSound>["play"]>[0]> = {
  NEW_FOLLOWER: "follow",
  POST_REACTION: "reaction",
  STREAK_MILESTONE: "streak-milestone",
  MESSAGE: "message-receive",
};

export function useUnreadCount() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.auth.user?.id);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const { play } = useSound();
  const playRef = useRef(play);

  useEffect(() => {
    playRef.current = play;
  }, [play]);

  useEffect(() => {
    if (!userId || !accessToken) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    channel = supabase.channel(`hb-notification:${userId}`, {
      config: { private: false },
    });

    channel
      .on("broadcast", { event: "INSERT" }, (payload) => {
        dispatch(notificationApi.util.invalidateTags(["Notifications"]));

        const notifType = (payload as Record<string, unknown>).payload as
          | Record<string, unknown>
          | undefined;
        const type = notifType?.type as string | undefined;
        if (type) {
          const soundKey = NOTIF_SOUND_MAP[type];
          if (soundKey) playRef.current(soundKey);
        }
      })
      .on("broadcast", { event: "NOTIFICATION_READ" }, () => {
        dispatch(notificationApi.util.invalidateTags(["Notifications"]));
      })
      .on("broadcast", { event: "ALL_NOTIFICATIONS_READ" }, () => {
        dispatch(notificationApi.util.invalidateTags(["Notifications"]));
      })
      .on("broadcast", { event: "NOTIFICATION_DELETED" }, () => {
        dispatch(notificationApi.util.invalidateTags(["Notifications"]));
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, accessToken, dispatch]);
}
