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

        const patch = dispatch(
          reelsApi.util.updateQueryData("browseReels", { cursor: undefined }, (draft) => {
            draft.reels.unshift(optimistic);
          }),
        );

        try {
          const { data: newReel } = await queryFulfilled;
          dispatch(
            reelsApi.util.updateQueryData("browseReels", { cursor: undefined }, (draft) => {
              const idx = draft.reels.findIndex((r) => r.id === tempId);
              if (idx >= 0) draft.reels[idx].id = newReel.id;
            }),
          );
        } catch {
          patch.undo();
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
      invalidatesTags: ["Reels"],
      transformResponse: (response: { success: boolean; data: Reel }) => response.data,
      async onQueryStarted(_formData, { dispatch, queryFulfilled }) {
        try {
          const { data: newReel } = await queryFulfilled;
          dispatch(
            reelsApi.util.updateQueryData("browseReels", { cursor: undefined }, (draft) => {
              draft.reels.unshift(newReel);
            }),
          );
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
      onQueryStarted: async (reelId, { dispatch, queryFulfilled }) => {
        const patchBrowse = dispatch(
          reelsApi.util.updateQueryData("browseReels", { cursor: undefined }, (draft) => {
            const reel = draft.reels.find((r) => r.id === reelId);
            if (reel) {
              reel.isLiked = !reel.isLiked;
              reel.likesCount = Math.max(0, reel.likesCount + (reel.isLiked ? 1 : -1));
            }
          }),
        );
        const patchSingle = dispatch(
          reelsApi.util.updateQueryData("getReel", reelId, (draft) => {
            draft.isLiked = !draft.isLiked;
            draft.likesCount = Math.max(0, draft.likesCount + (draft.isLiked ? 1 : -1));
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          soundManager.playError();
          patchBrowse.undo();
          patchSingle.undo();
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
      onQueryStarted: async ({ reelId }, { dispatch, queryFulfilled }) => {
        const patchSingle = dispatch(
          reelsApi.util.updateQueryData("getReel", reelId, (draft) => {
            draft.commentsCount += 1;
          }),
        );
        const patchBrowse = dispatch(
          reelsApi.util.updateQueryData("browseReels", { cursor: undefined }, (draft) => {
            const reel = draft.reels.find((r) => r.id === reelId);
            if (reel) reel.commentsCount += 1;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          soundManager.playError();
          patchSingle.undo();
          patchBrowse.undo();
        }
      },
    }),

    deleteReelComment: builder.mutation<void, { reelId: string; commentId: string }>({
      query: ({ reelId, commentId }) => ({
        url: `/${reelId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { reelId }) => [{ type: "Reel", id: reelId }],
      onQueryStarted: async ({ reelId }, { dispatch, queryFulfilled }) => {
        const patchSingle = dispatch(
          reelsApi.util.updateQueryData("getReel", reelId, (draft) => {
            draft.commentsCount = Math.max(0, draft.commentsCount - 1);
          }),
        );
        const patchBrowse = dispatch(
          reelsApi.util.updateQueryData("browseReels", { cursor: undefined }, (draft) => {
            const reel = draft.reels.find((r) => r.id === reelId);
            if (reel) reel.commentsCount = Math.max(0, reel.commentsCount - 1);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          soundManager.playError();
          patchSingle.undo();
          patchBrowse.undo();
        }
      },
    }),

    deleteReel: builder.mutation<void, string>({
      query: (reelId) => ({
        url: `/${reelId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, reelId) => [{ type: "Reel", id: reelId }, "Reels"],
      onQueryStarted: async (reelId, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          reelsApi.util.updateQueryData("browseReels", { cursor: undefined }, (draft) => {
            draft.reels = draft.reels.filter((r) => r.id !== reelId);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          soundManager.playError();
          patch.undo();
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
      onQueryStarted: async ({ reelId, ...body }, { dispatch, queryFulfilled }) => {
        const patchSingle = dispatch(
          reelsApi.util.updateQueryData("getReel", reelId, (draft) => {
            Object.assign(draft, body);
          }),
        );
        const patchBrowse = dispatch(
          reelsApi.util.updateQueryData("browseReels", { cursor: undefined }, (draft) => {
            const reel = draft.reels.find((r) => r.id === reelId);
            if (reel) Object.assign(reel, body);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          soundManager.playError();
          patchSingle.undo();
          patchBrowse.undo();
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
