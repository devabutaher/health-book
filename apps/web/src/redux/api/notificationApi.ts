/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import type { RootState } from "../store";

export interface Notification {
  id: string;
  type: string;
  userId: string;
  fromUserId: string | null;
  postId: string | null;
  commentId: string | null;
  message: string | null;
  read: boolean;
  createdAt: string;
  fromUser: { id: string; name: string; username: string; avatar: string | null } | null;
}

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/notifications`),
  tagTypes: ["Notifications"],
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (params: { cursor?: string; limit?: number } = {}) => {
        const search = new URLSearchParams();
        if (params.cursor) search.set("cursor", params.cursor);
        if (params.limit) search.set("limit", String(params.limit));
        return `/?${search.toString()}`;
      },
      providesTags: ["Notifications"],
      keepUnusedDataFor: 300,
    }),
    getUnreadCount: builder.query({
      query: () => "/unread-count",
      providesTags: ["Notifications"],
      keepUnusedDataFor: 600,
    }),
    markRead: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/read`,
        method: "POST",
      }),
      invalidatesTags: ["Notifications"],
      onQueryStarted: async (id, { dispatch, queryFulfilled, getState }) => {
        const queries = ((getState() as RootState) as any).notificationApi?.queries ?? {};
        const patches: { undo: () => void }[] = [];
        for (const key of Object.keys(queries)) {
          const entry = queries[key];
          if (entry?.data?.notifications?.some((n: any) => n.id === id)) {
            try {
              const p = dispatch(
                notificationApi.util.updateQueryData(
                  "getNotifications",
                  entry.arg,
                  (draft: any) => {
                    const n = draft.notifications?.find((x: any) => x.id === id);
                    if (n) n.read = true;
                  },
                ),
              );
              patches.push(p);
            } catch {}
            break;
          }
        }
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),
    markAllRead: builder.mutation({
      query: () => ({
        url: "/read-all",
        method: "POST",
      }),
      invalidatesTags: ["Notifications"],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled, getState }) => {
        const queries = ((getState() as RootState) as any).notificationApi?.queries ?? {};
        const patches: { undo: () => void }[] = [];
        for (const key of Object.keys(queries)) {
          const entry = queries[key];
          if (entry?.data?.notifications) {
            try {
              const p = dispatch(
                notificationApi.util.updateQueryData(
                  "getNotifications",
                  entry.arg,
                  (draft: any) => {
                    for (const n of draft.notifications ?? []) {
                      n.read = true;
                    }
                  },
                ),
              );
              patches.push(p);
            } catch {}
          }
        }
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),
    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
      onQueryStarted: async (id, { dispatch, queryFulfilled, getState }) => {
        const queries = ((getState() as RootState) as any).notificationApi?.queries ?? {};
        const patches: { undo: () => void }[] = [];
        for (const key of Object.keys(queries)) {
          const entry = queries[key];
          if (entry?.data?.notifications?.some((n: any) => n.id === id)) {
            try {
              const p = dispatch(
                notificationApi.util.updateQueryData(
                  "getNotifications",
                  entry.arg,
                  (draft: any) => {
                    draft.notifications = draft.notifications.filter(
                      (n: any) => n.id !== id,
                    );
                  },
                ),
              );
              patches.push(p);
            } catch {}
            break;
          }
        }
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;
