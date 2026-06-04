import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import type { StoryHighlight } from "@/types/story";

export const highlightsApi = createApi({
  reducerPath: "highlightsApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/highlights`),
  tagTypes: ["Highlights"],
  endpoints: (builder) => ({
    getHighlights: builder.query<StoryHighlight[], void>({
      query: () => "/",
      providesTags: ["Highlights"],
      transformResponse: (response: { success: boolean; data: StoryHighlight[] }) => response.data,
    }),

    createHighlight: builder.mutation<StoryHighlight, { title: string; coverUrl?: string }>({
      query: (body) => ({
        url: "/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Highlights"],
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
      invalidatesTags: ["Highlights"],
    }),

    deleteHighlight: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Highlights"],
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
      invalidatesTags: ["Highlights"],
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
