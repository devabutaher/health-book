import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";

export interface SearchUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

export const searchApi = createApi({
  reducerPath: "searchApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/search`),
  tagTypes: ["Search"],
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    searchUsers: builder.query<SearchUser[], string>({
      query: (q) => `/users?q=${encodeURIComponent(q)}`,
      transformResponse: (response: { success: boolean; users: SearchUser[] }) => response.users,
      keepUnusedDataFor: 60,
    }),
    searchPosts: builder.query({
      query: ({ q, cursor }: { q: string; cursor?: string }) => {
        const params = new URLSearchParams({ q });
        if (cursor) params.set("cursor", cursor);
        return `/posts?${params.toString()}`;
      },
      providesTags: ["Search"],
      keepUnusedDataFor: 60,
    }),
    searchHashtags: builder.query({
      query: (q: string) => `/hashtags?q=${encodeURIComponent(q)}`,
      providesTags: ["Search"],
      keepUnusedDataFor: 60,
    }),
    getRelatedHashtags: builder.query<{ tag: string; count: number }[], string>({
      query: (tag: string) => `/related-hashtags?tag=${encodeURIComponent(tag)}`,
      transformResponse: (response: { success: boolean; data: { tag: string; count: number }[] }) =>
        response.data,
      keepUnusedDataFor: 600,
    }),
  }),
});

export const {
  useSearchUsersQuery,
  useSearchPostsQuery,
  useSearchHashtagsQuery,
  useGetRelatedHashtagsQuery,
} = searchApi;
