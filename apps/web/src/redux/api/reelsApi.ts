import type { Reel, ReelComment } from "@/types/reel";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import { soundManager } from "@/lib/soundManager";
import type { RootState } from "../store";

export const reelsApi = createApi({
  reducerPath: "reelsApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/reels`),
  tagTypes: ["Reels", "Reel"],
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    browseReels: builder.query<
      { reels: Reel[]; nextCursor: string | null; hasMore: boolean },
      { cursor?: string }
    >({
      query: ({ cursor }) => (cursor ? `?cursor=${cursor}` : ""),
      providesTags: ["Reels"],
      transformResponse: (response: {
        success: boolean;
        data: { reels: Reel[]; nextCursor: string | null; hasMore: boolean };
      }) => response.data,
      keepUnusedDataFor: 300,
    }),

    getReel: builder.query<Reel, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Reel", id }],
      transformResponse: (response: { success: boolean; data: Reel }) => response.data,
      keepUnusedDataFor: 300,
    }),

    createReel: builder.mutation<
      Reel,
      { videoUrl: string; caption?: string; thumbnailUrl?: string }
    >({
      query: (body) => ({
        url: "/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Reels"],
      transformResponse: (response: { success: boolean; data: Reel }) => response.data,
      onQueryStarted: async (args, { dispatch, getState, queryFulfilled }) => {
        const user = (getState() as RootState).auth.user;
        if (!user) return;
        const tempId = `temp-${Date.now()}`;

        const optimistic: Reel = {
          id: tempId,
          videoUrl: args.videoUrl,
          caption: args.caption || null,
          thumbnailUrl: args.thumbnailUrl || null,
          user: { id: user.id, name: user.name, username: user.username, avatar: user.avatar },
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
          createdAt: new Date().toISOString(),
        };

        const patches: { undo: () => void }[] = [];
        const state = getState() as RootState;
        const queries = state?.reelsApi?.queries ?? {};
        for (const key of Object.keys(queries)) {
          const q = queries[key];
          if (q?.endpointName === "browseReels" && q?.status === "fulfilled") {
            patches.push(
              dispatch(
                reelsApi.util.updateQueryData("browseReels", q.originalArgs, (draft) => {
                  draft.reels.unshift(optimistic);
                }),
              ),
            );
          }
        }

        try {
          const { data: newReel } = await queryFulfilled;
          for (const key of Object.keys(queries)) {
            const q = queries[key];
            if (q?.endpointName === "browseReels" && q?.status === "fulfilled") {
              dispatch(
                reelsApi.util.updateQueryData("browseReels", q.originalArgs, (draft) => {
                  const idx = draft.reels.findIndex((r) => r.id === tempId);
                  if (idx >= 0) draft.reels[idx].id = newReel.id;
                }),
              );
            }
          }
        } catch {
          patches.forEach((p) => p.undo());
          soundManager.playError();
        }
      },
    }),

    uploadReel: builder.mutation<Reel, FormData>({
      query: (formData) => ({
        url: "/upload",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: { success: boolean; data: Reel }) => response.data,
      async onQueryStarted(_formData, { dispatch, getState, queryFulfilled }) {
        try {
          const { data: newReel } = await queryFulfilled;
          const state = getState() as RootState;
          const queries = state?.reelsApi?.queries ?? {};
          for (const key of Object.keys(queries)) {
            const q = queries[key];
            if (q?.endpointName === "browseReels" && q?.status === "fulfilled") {
              dispatch(
                reelsApi.util.updateQueryData("browseReels", q.originalArgs, (draft) => {
                  draft.reels.unshift(newReel);
                }),
              );
            }
          }
        } catch {
          soundManager.playError();
        }
      },
    }),

    toggleReelLike: builder.mutation<{ liked: boolean }, string>({
      query: (reelId) => ({
        url: `/${reelId}/like`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, reelId) => [{ type: "Reel", id: reelId }],
      onQueryStarted: async (reelId, { dispatch, getState, queryFulfilled }) => {
        const patches: { undo: () => void }[] = [];
        const state = getState() as RootState;
        const queries = state?.reelsApi?.queries ?? {};
        for (const key of Object.keys(queries)) {
          const q = queries[key];
          if (q?.endpointName === "browseReels" && q?.status === "fulfilled") {
            patches.push(
              dispatch(
                reelsApi.util.updateQueryData("browseReels", q.originalArgs, (draft) => {
                  const reel = draft.reels.find((r) => r.id === reelId);
                  if (reel) {
                    reel.isLiked = !reel.isLiked;
                    reel.likesCount = Math.max(0, reel.likesCount + (reel.isLiked ? 1 : -1));
                  }
                }),
              ),
            );
          }
        }
        patches.push(
          dispatch(
            reelsApi.util.updateQueryData("getReel", reelId, (draft) => {
              draft.isLiked = !draft.isLiked;
              draft.likesCount = Math.max(0, draft.likesCount + (draft.isLiked ? 1 : -1));
            }),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          soundManager.playError();
          patches.forEach((p) => p.undo());
        }
      },
    }),

    addReelComment: builder.mutation<ReelComment, { reelId: string; content: string }>({
      query: ({ reelId, ...body }) => ({
        url: `/${reelId}/comments`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { reelId }) => [{ type: "Reel", id: reelId }],
      onQueryStarted: async ({ reelId }, { dispatch, getState, queryFulfilled }) => {
        const patches: { undo: () => void }[] = [];
        const state = getState() as RootState;
        const queries = state?.reelsApi?.queries ?? {};
        for (const key of Object.keys(queries)) {
          const q = queries[key];
          if (q?.endpointName === "browseReels" && q?.status === "fulfilled") {
            patches.push(
              dispatch(
                reelsApi.util.updateQueryData("browseReels", q.originalArgs, (draft) => {
                  const reel = draft.reels.find((r) => r.id === reelId);
                  if (reel) reel.commentsCount += 1;
                }),
              ),
            );
          }
        }
        patches.push(
          dispatch(
            reelsApi.util.updateQueryData("getReel", reelId, (draft) => {
              draft.commentsCount += 1;
            }),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          soundManager.playError();
          patches.forEach((p) => p.undo());
        }
      },
    }),

    deleteReelComment: builder.mutation<void, { reelId: string; commentId: string }>({
      query: ({ reelId, commentId }) => ({
        url: `/${reelId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { reelId }) => [{ type: "Reel", id: reelId }],
      onQueryStarted: async ({ reelId }, { dispatch, getState, queryFulfilled }) => {
        const patches: { undo: () => void }[] = [];
        const state = getState() as RootState;
        const queries = state?.reelsApi?.queries ?? {};
        for (const key of Object.keys(queries)) {
          const q = queries[key];
          if (q?.endpointName === "browseReels" && q?.status === "fulfilled") {
            patches.push(
              dispatch(
                reelsApi.util.updateQueryData("browseReels", q.originalArgs, (draft) => {
                  const reel = draft.reels.find((r) => r.id === reelId);
                  if (reel) reel.commentsCount = Math.max(0, reel.commentsCount - 1);
                }),
              ),
            );
          }
        }
        patches.push(
          dispatch(
            reelsApi.util.updateQueryData("getReel", reelId, (draft) => {
              draft.commentsCount = Math.max(0, draft.commentsCount - 1);
            }),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          soundManager.playError();
          patches.forEach((p) => p.undo());
        }
      },
    }),

    deleteReel: builder.mutation<void, string>({
      query: (reelId) => ({
        url: `/${reelId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, reelId) => [{ type: "Reel", id: reelId }, "Reels"],
      onQueryStarted: async (reelId, { dispatch, getState, queryFulfilled }) => {
        const patches: { undo: () => void }[] = [];
        const state = getState() as RootState;
        const queries = state?.reelsApi?.queries ?? {};
        for (const key of Object.keys(queries)) {
          const q = queries[key];
          if (q?.endpointName === "browseReels" && q?.status === "fulfilled") {
            patches.push(
              dispatch(
                reelsApi.util.updateQueryData("browseReels", q.originalArgs, (draft) => {
                  draft.reels = draft.reels.filter((r) => r.id !== reelId);
                }),
              ),
            );
          }
        }
        try {
          await queryFulfilled;
        } catch {
          soundManager.playError();
          patches.forEach((p) => p.undo());
        }
      },
    }),

    updateReel: builder.mutation<Reel, { reelId: string; caption?: string }>({
      query: ({ reelId, ...body }) => ({
        url: `/${reelId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { reelId }) => [{ type: "Reel", id: reelId }],
      transformResponse: (response: { success: boolean; data: Reel }) => response.data,
      onQueryStarted: async ({ reelId, ...body }, { dispatch, getState, queryFulfilled }) => {
        const patches: { undo: () => void }[] = [];
        const state = getState() as RootState;
        const queries = state?.reelsApi?.queries ?? {};
        for (const key of Object.keys(queries)) {
          const q = queries[key];
          if (q?.endpointName === "browseReels" && q?.status === "fulfilled") {
            patches.push(
              dispatch(
                reelsApi.util.updateQueryData("browseReels", q.originalArgs, (draft) => {
                  const reel = draft.reels.find((r) => r.id === reelId);
                  if (reel) Object.assign(reel, body);
                }),
              ),
            );
          }
        }
        patches.push(
          dispatch(
            reelsApi.util.updateQueryData("getReel", reelId, (draft) => {
              Object.assign(draft, body);
            }),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          soundManager.playError();
          patches.forEach((p) => p.undo());
        }
      },
    }),
  }),
});

export const {
  useBrowseReelsQuery,
  useGetReelQuery,
  useUploadReelMutation,
  useToggleReelLikeMutation,
  useAddReelCommentMutation,
  useDeleteReelCommentMutation,
  useDeleteReelMutation,
  useUpdateReelMutation,
} = reelsApi;
