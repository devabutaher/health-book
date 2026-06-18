/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Conversation, Message } from "@/types/conversation";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import type { RootState } from "../store";
import { soundManager } from "@/lib/soundManager";

export const messagingApi = createApi({
  reducerPath: "messagingApi",
  baseQuery: createBaseQuery(process.env.NEXT_PUBLIC_API_URL + "/api/messages"),
  tagTypes: ["Conversations", "Conversation", "MessageUnread"],
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getConversations: builder.query<
      { data: Conversation[]; nextCursor: string | null; hasMore: boolean },
      { cursor?: string } | void
    >({
      query: (args) => {
        const cursor = (args as { cursor?: string })?.cursor;
        return cursor ? `/conversations?cursor=${cursor}` : "/conversations";
      },
      providesTags: ["Conversations"],
      transformResponse: (response: {
        success: boolean;
        data: { data: Conversation[]; nextCursor: string | null; hasMore: boolean };
      }) => response.data,
      serializeQueryArgs: ({ queryArgs }) => {
        const arg = queryArgs as { cursor?: string } | undefined;
        return arg?.cursor ?? "__initial__";
      },
      merge: (currentCache, newItems) => {
        if (!newItems) return;
        if (!currentCache) return newItems;
        const existingIds = new Set(currentCache.data.map((c) => c.id));
        return {
          data: [...currentCache.data, ...newItems.data.filter((c) => !existingIds.has(c.id))],
          nextCursor: newItems.nextCursor,
          hasMore: newItems.hasMore,
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        const cur = (currentArg as { cursor?: string } | undefined)?.cursor;
        const prev = (previousArg as { cursor?: string } | undefined)?.cursor;
        return cur !== prev;
      },
      keepUnusedDataFor: 300,
    }),

    getUnreadCount: builder.query<{ count: number }, void>({
      query: () => "/unread-count",
      providesTags: ["MessageUnread"],
      transformResponse: (response: { success: boolean; data: { count: number } }) => response.data,
      keepUnusedDataFor: 600,
    }),

    createConversation: builder.mutation<
      Conversation,
      { participantIds: string[]; isGroup?: boolean; groupName?: string }
    >({
      invalidatesTags: ["Conversations"],
      query: (body) => ({
        url: "/conversations",
        method: "POST",
        body,
      }),
      transformResponse: (response: { success: boolean; data: Conversation }) => response.data,
      onQueryStarted: async (args, { dispatch, getState, queryFulfilled }) => {
        const user = (getState() as RootState).auth.user;
        if (!user) return;
        const tempId = `temp-${Date.now()}`;

        const participants = [
          ...args.participantIds.map((pid) => ({
            userId: pid,
            user: { id: pid, name: "", username: "", avatar: null as string | null },
            role: (pid === user.id ? "admin" : "member") as string,
            joinedAt: new Date().toISOString(),
            isMuted: false,
            lastReadAt: null as string | null,
          })),
        ];

        const optimistic: Conversation = {
          id: tempId,
          isGroup: args.isGroup || false,
          groupName: args.groupName || null,
          groupAvatar: null,
          participants,
          lastMessage: null,
          unreadCount: 0,
          isMuted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const patch = dispatch(
          messagingApi.util.updateQueryData("getConversations", undefined, (draft) => {
            if (!draft?.data) return;
            draft.data.unshift(optimistic);
          }),
        );

        try {
          const { data: conv } = await queryFulfilled;
          if (conv?.id) {
            dispatch(
              messagingApi.util.updateQueryData("getConversations", undefined, (draft) => {
                if (!draft?.data) return;
                const idx = draft.data.findIndex((c) => c.id === tempId);
                if (idx >= 0) {
                  draft.data[idx] = conv;
                }
              }),
            );
          }
        } catch {
          patch.undo();
          soundManager.playError();
        }
      },
    }),

    getConversation: builder.query<
      { messages: Message[]; nextCursor: string | null; hasMore: boolean },
      { id: string; cursor?: string }
    >({
      query: ({ id, cursor }) => "/conversations/" + id + (cursor ? "?cursor=" + cursor : ""),
      providesTags: (_result, _error, { id }) => [{ type: "Conversation", id }],
      transformResponse: (response: {
        success: boolean;
        data: { messages: Message[]; nextCursor: string | null; hasMore: boolean };
      }) => response.data,
      keepUnusedDataFor: 300,
    }),

    sendMessage: builder.mutation<
      Message,
      {
        conversationId: string;
        content?: string;
        mediaUrl?: string;
        sharedPostId?: string;
        messageType?: string;
        storyId?: string;
        storyReplyData?: Record<string, unknown>;
      }
    >({
      query: ({ conversationId, ...body }) => ({
        url: "/conversations/" + conversationId + "/messages",
        method: "POST",
        body,
      }),
      transformResponse: (response: { success: boolean; data: Message }) => response.data,
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: "Conversations" },
        { type: "Conversation", id: conversationId },
      ],
      onQueryStarted: async (
        { conversationId, content, mediaUrl, sharedPostId, messageType, storyId, storyReplyData },
        { dispatch, getState, queryFulfilled },
      ) => {
        const user = (getState() as RootState).auth.user;
        if (!user) return;
        const tempId = `temp-${Date.now()}`;

        const patchMessages = dispatch(
          messagingApi.util.updateQueryData("getConversation", { id: conversationId }, (draft) => {
            if (!draft) return;
            const optimistic: Message & { messageType: string } = {
              id: tempId,
              conversationId,
              senderId: user.id,
              sender: {
                id: user.id,
                name: user.name,
                username: user.username,
                avatar: user.avatar,
              },
              content: content || null,
              mediaUrl: mediaUrl || null,
              sharedPostId: (sharedPostId as string | null) || null,
              messageType: messageType || "text",
              storyId: storyId || undefined,
              storyReplyData: storyReplyData as Record<string, unknown> | undefined,
              isDeleted: false,
              createdAt: new Date().toISOString(),
            };
            draft.messages.push(optimistic);
          }),
        );

        // Also update conversation list preview
        const patchConvList = dispatch(
          messagingApi.util.updateQueryData("getConversations", undefined, (draft) => {
            if (!draft?.data) return;
            const conv = draft.data.find((c) => c.id === conversationId);
            if (conv) {
              (conv as any).lastMessage = {
                id: tempId,
                content: content || null,
                mediaUrl: mediaUrl || null,
                sharedPostId: (sharedPostId as string | null) || null,
                messageType: messageType || "text",
                senderId: user.id,
                sender: {
                  id: user.id,
                  name: user.name,
                  username: user.username,
                  avatar: user.avatar,
                },
                createdAt: new Date().toISOString(),
              };
            }
          }),
        );

        try {
          const result = await queryFulfilled;
          const msg = result.data as { id: string };
          if (msg?.id) {
            dispatch(
              messagingApi.util.updateQueryData(
                "getConversation",
                { id: conversationId },
                (draft) => {
                  if (!draft) return;
                  const idx = draft.messages.findIndex((m) => m.id === tempId);
                  if (idx >= 0) draft.messages[idx].id = msg.id;
                },
              ),
            );
          }
        } catch {
          patchMessages.undo();
          patchConvList.undo();
          soundManager.playError();
        }
      },
    }),
    deleteMessage: builder.mutation<
      void,
      { messageId: string; conversationId: string; forAll?: boolean }
    >({
      invalidatesTags: (_result, _error, { conversationId }) => [{ type: "Conversation", id: conversationId }],
      query: ({ messageId, forAll }) => ({
        url: "/messages/" + messageId + (forAll ? "?forAll=true" : ""),
        method: "DELETE",
      }),
      onQueryStarted: async ({ messageId, conversationId }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          messagingApi.util.updateQueryData("getConversation", { id: conversationId }, (draft) => {
            if (!draft) return;
            const idx = draft.messages.findIndex((m) => m.id === messageId);
            if (idx >= 0) draft.messages[idx].isDeleted = true;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
          soundManager.playError();
        }
      },
    }),
    toggleMute: builder.mutation<{ isMuted: boolean }, string>({
      query: (conversationId) => ({
        url: "/conversations/" + conversationId + "/mute",
        method: "POST",
      }),
      invalidatesTags: ["Conversations"],
      onQueryStarted: async (conversationId, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          messagingApi.util.updateQueryData("getConversations", undefined, (draft) => {
            if (!draft?.data) return;
            const conv = draft.data.find((c) => c.id === conversationId);
            if (!conv) return;
            conv.isMuted = !conv.isMuted;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
          soundManager.playError();
        }
      },
    }),
    markRead: builder.mutation<void, string>({
      query: (conversationId) => ({
        url: "/conversations/" + conversationId + "/read",
        method: "POST",
      }),
      invalidatesTags: (_result, _error, conversationId) => [
        "Conversations",
        { type: "Conversation", id: conversationId },
        "MessageUnread",
      ],
      onQueryStarted: async (conversationId, { dispatch, queryFulfilled }) => {
        const patchConv = dispatch(
          messagingApi.util.updateQueryData("getConversations", undefined, (draft) => {
            if (!draft?.data) return;
            const conv = draft.data.find((c) => c.id === conversationId);
            if (!conv) return;
            const actualUnread = conv.unreadCount || 0;
            conv.unreadCount = 0;
            // Also update global count by the actual unread amount
            const patchUnread = dispatch(
              messagingApi.util.updateQueryData("getUnreadCount", undefined, (draft2) => {
                if (draft2.count > 0) draft2.count = Math.max(0, draft2.count - actualUnread);
              }),
            );
            // Track patchUnread for rollback
            (patchConv as any).__unread = patchUnread;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          const p = patchConv as any;
          p.undo();
          if (p.__unread) p.__unread.undo();
          soundManager.playError();
        }
      },
    }),

    deleteConversation: builder.mutation<void, { conversationId: string; forEveryone?: boolean }>({
      query: ({ conversationId, forEveryone }) => ({
        url: "/conversations/" + conversationId + (forEveryone ? "?forEveryone=true" : ""),
        method: "DELETE",
      }),
      // Fix: only invalidate specific conversation
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: "Conversation", id: conversationId },
      ],
      onQueryStarted: async ({ conversationId }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          messagingApi.util.updateQueryData("getConversations", undefined, (draft) => {
            if (!draft?.data) return;
            const idx = draft.data.findIndex((c) => c.id === conversationId);
            if (idx >= 0) draft.data.splice(idx, 1);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
          soundManager.playError();
        }
      },
    }),

    clearMessages: builder.mutation<void, string>({
      query: (conversationId) => ({
        url: "/conversations/" + conversationId + "/messages",
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, conversationId) => [
        { type: "Conversation", id: conversationId },
      ],
      onQueryStarted: async (conversationId, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          messagingApi.util.updateQueryData("getConversation", { id: conversationId }, (draft) => {
            if (!draft) return;
            draft.messages = [];
            draft.nextCursor = null;
            draft.hasMore = false;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
          soundManager.playError();
        }
      },
    }),

    addParticipant: builder.mutation<
      { user: { id: string; name: string; username: string; avatar: string | null } },
      { conversationId: string; userId: string }
    >({
      query: ({ conversationId, userId }) => ({
        url: "/conversations/" + conversationId + "/participants",
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: "Conversation", id: conversationId },
      ],
      onQueryStarted: async (
        { conversationId, userId },
        { getState, dispatch, queryFulfilled },
      ) => {
        const currentUser = (getState() as RootState).auth.user;
        if (!currentUser) return;
        const patch = dispatch(
          messagingApi.util.updateQueryData("getConversations", undefined, (draft) => {
            if (!draft?.data) return;
            const conv = draft.data.find((c) => c.id === conversationId);
            if (!conv || conv.participants.some((p) => p.userId === userId)) return;
            conv.participants.push({
              userId,
              user: { id: userId, name: "", username: "", avatar: null },
              role: "member",
              joinedAt: new Date().toISOString(),
              isMuted: false,
              lastReadAt: null,
            });
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
          soundManager.playError();
        }
      },
    }),

    removeParticipant: builder.mutation<void, { conversationId: string; userId: string }>({
      query: ({ conversationId, userId }) => ({
        url: "/conversations/" + conversationId + "/participants/" + userId,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: "Conversation", id: conversationId },
      ],
      onQueryStarted: async ({ conversationId, userId }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          messagingApi.util.updateQueryData("getConversations", undefined, (draft) => {
            if (!draft?.data) return;
            const conv = draft.data.find((c) => c.id === conversationId);
            if (!conv) return;
            const idx = conv.participants.findIndex((p) => p.userId === userId);
            if (idx !== -1) conv.participants.splice(idx, 1);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
          soundManager.playError();
        }
      },
    }),

    promoteToAdmin: builder.mutation<void, { conversationId: string; userId: string }>({
      query: ({ conversationId, userId }) => ({
        url: "/conversations/" + conversationId + "/promote/" + userId,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: "Conversation", id: conversationId },
      ],
      onQueryStarted: async ({ conversationId, userId }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          messagingApi.util.updateQueryData("getConversations", undefined, (draft) => {
            if (!draft?.data) return;
            const conv = draft.data.find((c) => c.id === conversationId);
            if (!conv) return;
            const participant = conv.participants.find((p) => p.userId === userId);
            if (participant) participant.role = "admin";
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
          soundManager.playError();
        }
      },
    }),

    updateGroupInfo: builder.mutation<
      Conversation,
      { conversationId: string; groupName?: string; groupAvatar?: string }
    >({
      query: ({ conversationId, ...body }) => ({
        url: "/conversations/" + conversationId + "/group-info",
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: "Conversation", id: conversationId },
      ],
      onQueryStarted: async (
        { conversationId, groupName, groupAvatar },
        { dispatch, queryFulfilled },
      ) => {
        const patch = dispatch(
          messagingApi.util.updateQueryData("getConversations", undefined, (draft) => {
            if (!draft?.data) return;
            const conv = draft.data.find((c) => c.id === conversationId);
            if (!conv) return;
            if (groupName !== undefined) conv.groupName = groupName;
            if (groupAvatar !== undefined) conv.groupAvatar = groupAvatar;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
          soundManager.playError();
        }
      },
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetUnreadCountQuery,
  useCreateConversationMutation,
  useGetConversationQuery,
  useSendMessageMutation,
  useDeleteMessageMutation,
  useToggleMuteMutation,
  useMarkReadMutation,
  useDeleteConversationMutation,
  useClearMessagesMutation,
  useAddParticipantMutation,
  useRemoveParticipantMutation,
  usePromoteToAdminMutation,
  useUpdateGroupInfoMutation,
} = messagingApi;
