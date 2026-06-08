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

    const topic = `hb-challenge:${challengeId}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    channel = supabase.channel(topic, { config: { private: false } });

    channel
      .on("broadcast", { event: "CHECK_IN" }, () => {
        dispatch(
          challengesApi.util.invalidateTags([
            { type: "Challenge", id: challengeId },
            { type: "Leaderboard", id: challengeId },
          ]),
        );
      })
      .on("broadcast", { event: "PARTICIPANT_JOINED" }, () => {
        dispatch(
          challengesApi.util.invalidateTags([
            { type: "Challenge", id: challengeId },
            { type: "Leaderboard", id: challengeId },
          ]),
        );
      })
      .on("broadcast", { event: "PARTICIPANT_LEFT" }, () => {
        dispatch(
          challengesApi.util.invalidateTags([
            { type: "Challenge", id: challengeId },
            { type: "Leaderboard", id: challengeId },
          ]),
        );
      })
      .on("broadcast", { event: "CHALLENGE_DELETED" }, () => {
        dispatch(challengesApi.util.invalidateTags(["Challenges"]));
      })
      .on("broadcast", { event: "NEW_COMMENT" }, () => {
        dispatch(challengesApi.util.invalidateTags([{ type: "Comments", id: challengeId }]));
      })
      .on("broadcast", { event: "COMMENT_DELETED" }, () => {
        dispatch(challengesApi.util.invalidateTags([{ type: "Comments", id: challengeId }]));
      })
      .on("broadcast", { event: "COMMENT_REACTION" }, () => {
        dispatch(challengesApi.util.invalidateTags([{ type: "Comments", id: challengeId }]));
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [challengeId, accessToken, dispatch]);
}
