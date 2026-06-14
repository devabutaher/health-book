"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppSelector, useAppDispatch } from "@/hooks";
import { healthLogApi } from "@/redux/api/healthLogApi";

export function useHealthLogRealtime() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const userId = useAppSelector((s) => s.auth.user?.id);

  useEffect(() => {
    if (!userId || !accessToken) return;

    const topic = `hb-health:${userId}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    channel = supabase.channel(topic, { config: { private: false } });

    channel
      .on("broadcast", { event: "HEALTH_LOG_CREATED" }, () => {
        dispatch(healthLogApi.util.invalidateTags(["HealthLogs", "HealthStats"]));
      })
      .on("broadcast", { event: "HEALTH_LOG_UPDATED" }, () => {
        dispatch(healthLogApi.util.invalidateTags(["HealthLogs", "HealthStats"]));
      })
      .on("broadcast", { event: "HEALTH_LOG_DELETED" }, () => {
        dispatch(healthLogApi.util.invalidateTags(["HealthLogs", "HealthStats"]));
      })
      .on("broadcast", { event: "HEALTH_LOG_SHARED" }, () => {
        dispatch(healthLogApi.util.invalidateTags(["HealthLogs"]));
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, accessToken, dispatch]);
}
