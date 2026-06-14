"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppSelector, useAppDispatch } from "@/hooks";
import { postApi } from "@/redux/api/postApi";
import { commentApi } from "@/redux/api/commentApi";

export function usePostRealtime(postId: string | null) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);

  useEffect(() => {
    if (!postId || !accessToken) return;

    const topic = `hb-post:${postId}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    channel = supabase.channel(topic, { config: { private: false } });

    channel
      .on("broadcast", { event: "POST_UPDATED" }, () => {
        dispatch(postApi.util.invalidateTags([{ type: "Post", id: postId }, "Posts"]));
      })
      .on("broadcast", { event: "REACTION_ADDED" }, () => {
        dispatch(postApi.util.invalidateTags([{ type: "Post", id: postId }]));
      })
      .on("broadcast", { event: "REACTION_REMOVED" }, () => {
        dispatch(postApi.util.invalidateTags([{ type: "Post", id: postId }]));
      })
      .on("broadcast", { event: "REACTION_CHANGED" }, () => {
        dispatch(postApi.util.invalidateTags([{ type: "Post", id: postId }]));
      })
      .on("broadcast", { event: "POST_DELETED" }, () => {
        dispatch(postApi.util.invalidateTags([{ type: "Post", id: postId }, "Posts"]));
      })
      .on("broadcast", { event: "NEW_COMMENT" }, () => {
        dispatch(commentApi.util.invalidateTags([{ type: "Comments", id: postId }]));
        dispatch(postApi.util.invalidateTags([{ type: "Post", id: postId }]));
      })
      .on("broadcast", { event: "COMMENT_UPDATED" }, () => {
        dispatch(commentApi.util.invalidateTags([{ type: "Comments", id: postId }]));
      })
      .on("broadcast", { event: "COMMENT_PINNED" }, () => {
        dispatch(commentApi.util.invalidateTags([{ type: "Comments", id: postId }]));
        dispatch(postApi.util.invalidateTags([{ type: "Post", id: postId }]));
      })
      .on("broadcast", { event: "COMMENT_DELETED" }, () => {
        dispatch(commentApi.util.invalidateTags([{ type: "Comments", id: postId }]));
        dispatch(postApi.util.invalidateTags([{ type: "Post", id: postId }]));
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [postId, accessToken, dispatch]);
}
