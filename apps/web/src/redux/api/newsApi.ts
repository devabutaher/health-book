import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import type { NewsArticle } from "@/types/news";

export const newsApi = createApi({
  reducerPath: "newsApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/news`),
  tagTypes: ["News"],
  endpoints: (builder) => ({
    getNews: builder.query<NewsArticle[], string | undefined>({
      query: (category) => (category ? `/?category=${category}` : "/"),
      providesTags: ["News"],
      transformResponse: (response: { success: boolean; data: NewsArticle[] }) => response.data,
    }),
  }),
});

export const { useGetNewsQuery } = newsApi;
