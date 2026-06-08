/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import type { StoryHighlight } from "@/types/story";
import { soundManager } from "@/lib/soundManager";

export const highlightsApi = createApi({
  reducerPath: "highlightsApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/highlights`),
  tagTypes: ["Highlights"],
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getHighlights: builder.query<StoryHighlight[], void>({
      query: () => "/",
      providesTags: ["Highlights"],
      transformResponse: (response: { success: boolean; data: StoryHighlight[] }) => response.data,
      keepUnusedDataFor: 300,
    }),

    createHighlight: builder.mutation<StoryHighlight, { title: string; coverUrl?: string }>({
      query: (body) => ({
        url: "/",
        method: "POST",
        body,
      }),
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        try {
          const { data: newHighlight } = await queryFulfilled;
          dispatch(
            highlightsApi.util.updateQueryData("getHighlights", undefined, (draft) => {
              draft.push(newHighlight);
            }),
          );
        } catch {
          soundManager.playError();
        }
      },
    }),

    updateHighlight: builder.mutation<
      StoryHighlight,
      { id: string; title?: string; coverUrl?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/${id}`,
        method: "PUT",
        body,
      }),
      // Fix: optimistic update instead of invalidate
      onQueryStarted: async ({ id, ...body }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          highlightsApi.util.updateQueryData("getHighlights", undefined, (draft) => {
            const hl = draft.find((h) => h.id === id);
            if (hl) Object.assign(hl, body);
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

    deleteHighlight: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          highlightsApi.util.updateQueryData("getHighlights", undefined, (draft) => {
            const idx = draft.findIndex((h) => h.id === id);
            if (idx >= 0) draft.splice(idx, 1);
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

    addHighlightItem: builder.mutation<void, { highlightId: string; storyId: string }>({
      query: ({ highlightId, storyId }) => ({
        url: `/${highlightId}/items`,
        method: "POST",
        body: { storyId },
      }),
      invalidatesTags: ["Highlights"],
    }),

    removeHighlightItem: builder.mutation<void, { highlightId: string; itemId: string }>({
      query: ({ highlightId, itemId }) => ({
        url: `/${highlightId}/items/${itemId}`,
        method: "DELETE",
      }),
      onQueryStarted: async ({ highlightId, itemId }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          highlightsApi.util.updateQueryData("getHighlights", undefined, (draft) => {
            const hl = draft.find((h) => h.id === highlightId);
            if (hl && (hl as any).items) {
              (hl as any).items = (hl as any).items.filter((item: any) => item.id !== itemId);
            }
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
  }),
});

export const {
  useGetHighlightsQuery,
  useCreateHighlightMutation,
  useUpdateHighlightMutation,
  useDeleteHighlightMutation,
  useAddHighlightItemMutation,
  useRemoveHighlightItemMutation,
} = highlightsApi;
