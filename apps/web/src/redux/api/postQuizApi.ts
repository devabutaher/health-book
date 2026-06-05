import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import type { PostQuizResult, PostQuizResults } from "@/types/post";

export const postQuizApi = createApi({
  reducerPath: "postQuizApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/post-quiz`),
  tagTypes: ["PostQuiz"],
  endpoints: (builder) => ({
    answerQuiz: builder.mutation<PostQuizResult, { postId: string; selectedIndex: number }>({
      query: ({ postId, selectedIndex }) => ({
        url: `/${postId}/answer`,
        method: "POST",
        body: { selectedIndex },
      }),
      invalidatesTags: (_result, _error, { postId }) => [{ type: "PostQuiz", id: postId }],
      onQueryStarted: async ({ postId, selectedIndex }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          postQuizApi.util.updateQueryData("getQuizResults", postId, (draft) => {
            if (!draft) return;
            (draft as any).userAnswer = selectedIndex;
            draft.totalAnswers = (draft.totalAnswers ?? 0) + 1;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    getQuizResults: builder.query<PostQuizResults, string>({
      query: (postId) => `/${postId}/results`,
      providesTags: (_result, _error, postId) => [{ type: "PostQuiz", id: postId }],
      transformResponse: (response: { success: boolean; data: PostQuizResults }) => response.data,
      keepUnusedDataFor: 300,
    }),
  }),
});

export const { useAnswerQuizMutation, useGetQuizResultsQuery } = postQuizApi;
