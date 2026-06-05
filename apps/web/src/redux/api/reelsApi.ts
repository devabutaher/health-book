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
    }),

    toggleReelLike: builder.mutation<{ liked: boolean }, string>({
      query: (reelId) => ({
        url: `/${reelId}/like`,
        method: "POST",
      }),
      onQueryStarted: async (reelId, { dispatch, queryFulfilled }) => {
        // Fix: also update browseReels cache, not just getReel
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
      // Fix: no need to invalidate Reels — only update comment count optimistically
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
          patchSingle.undo();
          patchBrowse.undo();
        }
      },
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
