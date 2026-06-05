/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Conversation, Message } from "@/types/conversation";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import type { RootState } from "../store";

export const messagingApi = createApi({
  reducerPath: "messagingApi",
  baseQuery: createBaseQuery(process.env.NEXT_PUBLIC_API_URL + "/api/messages"),
  tagTypes: ["Conversations", "Conversation", "MessageUnread"],
  endpoints: (builder) => ({
    getConversations: builder.query<Conversation[], void>({
      query: () => "/conversations",
      providesTags: ["Conversations"],
      transformResponse: (response: { success: boolean; data: Conversation[] }) => response.data,
    }),

    getUnreadCount: builder.query<{ count: number }, void>({
      query: () => "/unread-count",
      providesTags: ["MessageUnread"],
      transformResponse: (response: { success: boolean; data: { count: number } }) => response.data,
    }),

    createConversation: builder.mutation<
      Conversation,
      { participantIds: string[]; isGroup?: boolean; groupName?: string }
    >({
      query: (body) => ({
        url: "/conversations",
        method: "POST",
        body,
      }),
      transformResponse: (response: { success: boolean; data: Conversation }) => response.data,
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        try {
          const { data: conv } = await queryFulfilled;
          if (!conv) return;
          dispatch(
            messagingApi.util.updateQueryData("getConversations", undefined, (draft) => {
              if (!Array.isArray(draft)) return;
              const exists = draft.find((c) => c.id === conv.id);
              if (!exists) draft.unshift(conv);
            }),
          );
        } catch {}
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
      onQueryStarted: async (
        { conversationId, content, mediaUrl, sharedPostId, messageType, storyId, storyReplyData },
        { dispatch, getState, queryFulfilled },
      ) => {
        const user = (getState() as RootState).auth.user;
        if (!user) return;
        const tempId = `temp-${Date.now()}`;

        const patchMessages = dispatch(
          messagingApi.util.updateQueryData(
            "getConversation",
            { id: conversationId },
            (draft) => {
              if (!draft) return;
              const optimistic: Message & { messageType: string } = {
                id: tempId,
                conversationId,
                senderId: user.id,
                sender: { id: user.id, name: user.name, username: user.username, avatar: user.avatar },
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
            },
          ),
        );

        // Also update conversation list preview
        const patchConvList = dispatch(
          messagingApi.util.updateQueryData("getConversations", undefined, (draft) => {
            if (!Array.isArray(draft)) return;
            const conv = draft.find((c) => c.id === conversationId);
            if (conv) {
              (conv as any).lastMessage = {
                content: content || null,
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
        }
      },
    }),

    deleteMessage: builder.mutation<
      void,
      { messageId: string; conversationId: string; forAll?: boolean }
    >({
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
        }
      },
    }),

    toggleMute: builder.mutation<{ isMuted: boolean }, string>({
      query: (conversationId) => ({
        url: "/conversations/" + conversationId + "/mute",
        method: "POST",
      }),
      onQueryStarted: async (conversationId, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          messagingApi.util.updateQueryData("getConversations", undefined, (draft) => {
            if (!Array.isArray(draft)) return;
            const conv = draft.find((c) => c.id === conversationId);
            if (!conv) return;
            conv.isMuted = !conv.isMuted;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    markRead: builder.mutation<void, string>({
      query: (conversationId) => ({
        url: "/conversations/" + conversationId + "/read",
        method: "POST",
      }),
      onQueryStarted: async (conversationId, { dispatch, queryFulfilled }) => {
        const patchConv = dispatch(
          messagingApi.util.updateQueryData("getConversations", undefined, (draft) => {
            if (!Array.isArray(draft)) return;
            const conv = draft.find((c) => c.id === conversationId);
            if (!conv) return;
            (conv as any).unreadCount = 0;
          }),
        );
        // Also update global unread count
        const patchUnread = dispatch(
          messagingApi.util.updateQueryData("getUnreadCount", undefined, (draft) => {
            if (draft.count > 0) draft.count = Math.max(0, draft.count - 1);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patchConv.undo();
          patchUnread.undo();
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
            if (!Array.isArray(draft)) return;
            const idx = draft.findIndex((c) => c.id === conversationId);
            if (idx >= 0) draft.splice(idx, 1);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
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
    }),

    removeParticipant: builder.mutation<void, { conversationId: string; userId: string }>({
      query: ({ conversationId, userId }) => ({
        url: "/conversations/" + conversationId + "/participants/" + userId,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: "Conversation", id: conversationId },
      ],
    }),

    promoteToAdmin: builder.mutation<void, { conversationId: string; userId: string }>({
      query: ({ conversationId, userId }) => ({
        url: "/conversations/" + conversationId + "/promote/" + userId,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: "Conversation", id: conversationId },
      ],
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
