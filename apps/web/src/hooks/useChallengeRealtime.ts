"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppSelector, useAppDispatch } from "@/hooks";
import { challengesApi } from "@/redux/api/challengesApi";

export function useChallengeRealtime(challengeId: string | null) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);

  useEffect(() => {
    if (!challengeId || !accessToken) return;

    const topic = `challenge:${challengeId}:leaderboard`;
    let cancel = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    ;(async () => {
      try {
        await supabase.realtime.setAuth(accessToken);
      } catch (err) {
        console.error("Challenge Realtime auth failed", err);
        return;
      }

      if (cancel) return;

      channel = supabase.channel(topic, { config: { private: false } });

      channel
        .on("broadcast", { event: "PROGRESS_UPDATE" }, () => {
          dispatch(
            challengesApi.util.invalidateTags([
              { type: "Challenge", id: challengeId },
              { type: "Leaderboard", id: challengeId },
            ]),
          );
        })
        .subscribe();
    })();

    return () => {
      cancel = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [challengeId, accessToken, dispatch]);
}
