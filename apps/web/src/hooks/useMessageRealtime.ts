"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { messagingApi } from "@/redux/api/messagingApi";
import { useSound } from "@/hooks/useSound";
import type { Message } from "@/types/conversation";

export function useMessageRealtime(conversationId: string | null, userId?: string) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const { play } = useSound();
  const playRef = useRef(play);
  useEffect(() => {
    playRef.current = play;
  }, [play]);

  useEffect(() => {
    if (!conversationId || !userId || !accessToken) return;

    const topic = `room:${conversationId}:messages`;
    let cancel = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    ;(async () => {
      try {
        await supabase.realtime.setAuth(accessToken);
      } catch (err) {
        console.error("Realtime auth failed", err);
        return;
      }

      if (cancel) return;

      channel = supabase.channel(topic, {
        config: { private: false },
      });

      let subscribeRetries = 0;

      channel
        .on("broadcast", { event: "INSERT" }, (broadcastPayload) => {
          const raw = broadcastPayload.payload as Record<string, unknown> | undefined;
          if (!raw) return;

          const messageId = raw.id as string;
          if (messageId.startsWith("temp-")) return;
          if (raw.senderId === userId) return;

          const rawSender = raw.sender as
            | { id: string; name: string; username: string; avatar: string | null }
            | undefined;

          const message: Message = {
            id: messageId,
            conversationId: raw.conversationId as string,
            senderId: raw.senderId as string,
            sender: {
              id: raw.senderId as string,
              name: rawSender?.name || (raw.senderName as string) || "Unknown",
              username: rawSender?.username || "",
              avatar: rawSender?.avatar || null,
            },
            content: (raw.content as string) || null,
            mediaUrl: (raw.mediaUrl as string | null) || null,
            sharedPostId: (raw.sharedPostId as string | null) || null,
            messageType: (raw.messageType as string) || "text",
            storyId: raw.storyId as string | undefined,
            storyReplyData: raw.storyReplyData as Record<string, unknown> | undefined,
            isDeleted: false,
            createdAt: (raw.createdAt as string) || new Date().toISOString(),
          };

          playRef.current("message-receive");

          dispatch(
            messagingApi.util.updateQueryData(
              "getConversation",
              { id: conversationId },
              (draft) => {
                if (!draft.messages.some((m) => m.id === message.id)) {
                  draft.messages.push(message);
                }
              },
            ),
          );
        })
        .subscribe((status) => {
          if (status === "TIMED_OUT" && subscribeRetries < 3) {
            subscribeRetries++;
            setTimeout(() => channel?.subscribe(), 500);
          }
        });
    })();

    return () => {
      cancel = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversationId, userId, accessToken, dispatch]);
}
