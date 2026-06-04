import type { Reel, ReelComment } from "@/types/reel";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";

export const reelsApi = createApi({
  reducerPath: "reelsApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/reels`),
  tagTypes: ["Reels", "Reel"],
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
    }),

    getReel: builder.query<Reel, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Reel", id }],
      transformResponse: (response: { success: boolean; data: Reel }) => response.data,
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
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        try {
          const { data: newReel } = await queryFulfilled;
          dispatch(
            reelsApi.util.updateQueryData("browseReels", { cursor: undefined }, (draft) => {
              draft.reels.unshift(newReel);
            }),
          );
        } catch {}
      },
    }),

    uploadReel: builder.mutation<Reel, FormData>({
      query: (formData) => ({
        url: "/upload",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: { success: boolean; data: Reel }) => response.data,
      async onQueryStarted(_formData, { dispatch, queryFulfilled }) {
        try {
          const { data: newReel } = await queryFulfilled;
          dispatch(
            reelsApi.util.updateQueryData("browseReels", { cursor: undefined }, (draft) => {
              draft.reels.unshift(newReel);
            }),
          );
        } catch {}
      },
      invalidatesTags: ["Reels"],
    }),

    toggleReelLike: builder.mutation<{ liked: boolean }, string>({
      query: (reelId) => ({
        url: `/${reelId}/like`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Reel", id }, "Reels"],
      onQueryStarted: async (reelId, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          reelsApi.util.updateQueryData("getReel", reelId, (draft) => {
            draft.isLiked = !draft.isLiked;
            draft.likesCount += draft.isLiked ? 1 : -1;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    addReelComment: builder.mutation<ReelComment, { reelId: string; content: string }>({
      query: ({ reelId, ...body }) => ({
        url: `/${reelId}/comments`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { reelId }) => [{ type: "Reel", id: reelId }, "Reels"],
      onQueryStarted: async ({ reelId }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          reelsApi.util.updateQueryData("getReel", reelId, (draft) => {
            draft.commentsCount += 1;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    deleteReelComment: builder.mutation<void, { reelId: string; commentId: string }>({
      query: ({ reelId, commentId }) => ({
        url: `/${reelId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { reelId }) => [{ type: "Reel", id: reelId }, "Reels"],
      onQueryStarted: async ({ reelId }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          reelsApi.util.updateQueryData("getReel", reelId, (draft) => {
            draft.commentsCount = Math.max(0, draft.commentsCount - 1);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    deleteReel: builder.mutation<void, string>({
      query: (reelId) => ({
        url: `/${reelId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Reels"],
      onQueryStarted: async (reelId, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          reelsApi.util.updateQueryData("browseReels", { cursor: undefined }, (draft) => {
            draft.reels = draft.reels.filter((r) => r.id !== reelId);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
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
      transformResponse: (response: { success: boolean; data: Reel }) => response.data,
      invalidatesTags: (_result, _error, { reelId }) => [{ type: "Reel", id: reelId }, "Reels"],
    }),
  }),
});

export const {
  useBrowseReelsQuery,
  useLazyBrowseReelsQuery,
  useGetReelQuery,
  useCreateReelMutation,
  useUploadReelMutation,
  useToggleReelLikeMutation,
  useAddReelCommentMutation,
  useDeleteReelCommentMutation,
  useDeleteReelMutation,
  useUpdateReelMutation,
} = reelsApi;
