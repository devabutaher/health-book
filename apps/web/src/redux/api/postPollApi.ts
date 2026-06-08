import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import type { PostPoll } from "@/types/post";
import { soundManager } from "@/lib/soundManager";

export const postPollApi = createApi({
  reducerPath: "postPollApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/post-polls`),
  tagTypes: ["PostPoll"],
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getPostPoll: builder.query<PostPoll, string>({
      query: (pollId) => `/${pollId}`,
      providesTags: (_result, _error, pollId) => [{ type: "PostPoll", id: pollId }],
      transformResponse: (response: { success: boolean; data: PostPoll }) => response.data,
    }),
    votePostPoll: builder.mutation<PostPoll, { pollId: string; optionIndex: number }>({
      query: ({ pollId, optionIndex }) => ({
        url: `/${pollId}/vote`,
        method: "POST",
        body: { optionIndex },
      }),
      invalidatesTags: (_result, _error, { pollId }) => [{ type: "PostPoll", id: pollId }],
      onQueryStarted: async ({ pollId, optionIndex }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          postPollApi.util.updateQueryData("getPostPoll", pollId, (draft) => {
            const prevVote = draft.userVote;
            const prevVoteEntry = draft.votes.find((v) => v.optionIndex === prevVote);
            if (prevVoteEntry) {
              prevVoteEntry._count = Math.max(0, prevVoteEntry._count - 1);
            }
            const newVoteEntry = draft.votes.find((v) => v.optionIndex === optionIndex);
            if (newVoteEntry) {
              newVoteEntry._count += 1;
            } else {
              draft.votes.push({ optionIndex, _count: 1 });
            }
            draft.userVote = optionIndex;
            if (prevVote === null || prevVote === undefined) {
              draft.totalVotes += 1;
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
    unvotePostPoll: builder.mutation<PostPoll, { pollId: string }>({
      query: ({ pollId }) => ({
        url: `/${pollId}/vote`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { pollId }) => [{ type: "PostPoll", id: pollId }],
      onQueryStarted: async ({ pollId }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          postPollApi.util.updateQueryData("getPostPoll", pollId, (draft) => {
            const userVote = draft.userVote;
            if (userVote === null || userVote === undefined) return;
            const voteEntry = draft.votes.find((v) => v.optionIndex === userVote);
            if (voteEntry) {
              voteEntry._count = Math.max(0, voteEntry._count - 1);
            }
            draft.userVote = null;
            draft.totalVotes = Math.max(0, draft.totalVotes - 1);
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

export const { useVotePostPollMutation, useUnvotePostPollMutation } = postPollApi;
