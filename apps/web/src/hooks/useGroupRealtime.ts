"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppSelector, useAppDispatch } from "@/hooks";
import { groupsApi } from "@/redux/api/groupsApi";
import { postApi } from "@/redux/api/postApi";

export function useGroupRealtime(groupId: string | null) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);

  useEffect(() => {
    if (!groupId || !accessToken) return;

    const topic = `hb-group:${groupId}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    channel = supabase.channel(topic, { config: { private: false } });

    channel
      .on("broadcast", { event: "MEMBER_JOINED" }, () => {
        dispatch(
          groupsApi.util.invalidateTags([
            { type: "Group", id: groupId },
            { type: "GroupMembers", id: `${groupId}-members` },
          ]),
        );
      })
      .on("broadcast", { event: "MEMBER_LEFT" }, () => {
        dispatch(
          groupsApi.util.invalidateTags([
            { type: "Group", id: groupId },
            { type: "GroupMembers", id: `${groupId}-members` },
          ]),
        );
      })
      .on("broadcast", { event: "MEMBER_REMOVED" }, () => {
        dispatch(
          groupsApi.util.invalidateTags([
            { type: "Group", id: groupId },
            { type: "GroupMembers", id: `${groupId}-members` },
          ]),
        );
      })
      .on("broadcast", { event: "POST_CREATED" }, (broadcastPayload) => {
        const gid = (broadcastPayload.payload as { groupId?: string })?.groupId;
        if (gid === groupId) {
          dispatch(postApi.util.invalidateTags([{ type: "Posts", id: `group-${gid}` }]));
        }
      })
      .on("broadcast", { event: "GROUP_UPDATED" }, () => {
        dispatch(
          groupsApi.util.invalidateTags([
            { type: "Group", id: groupId },
            "Groups",
            "MyGroups",
          ]),
        );
      })
      .on("broadcast", { event: "GROUP_DELETED" }, () => {
        dispatch(
          groupsApi.util.invalidateTags([
            { type: "Group", id: groupId },
            "Groups",
            "MyGroups",
          ]),
        );
      })
      .on("broadcast", { event: "MEMBER_ROLE_CHANGED" }, () => {
        dispatch(
          groupsApi.util.invalidateTags([
            { type: "Group", id: groupId },
            { type: "GroupMembers", id: `${groupId}-members` },
          ]),
        );
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [groupId, accessToken, dispatch]);
}
