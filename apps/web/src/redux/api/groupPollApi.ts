import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import type { GroupPoll } from "@/types/groupPoll";

export const groupPollApi = createApi({
  reducerPath: "groupPollApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/groups`),
  tagTypes: ["GroupPolls", "GroupPoll"],
  endpoints: (builder) => ({
    getGroupPolls: builder.query<GroupPoll[], string>({
      query: (groupId) => `/${groupId}/polls`,
      providesTags: (_result, _error, groupId) => [{ type: "GroupPolls", id: groupId }],
      transformResponse: (response: { success: boolean; data: GroupPoll[] }) => response.data,
    }),
    createPoll: builder.mutation<
      GroupPoll,
      {
        groupId: string;
        question: string;
        options: string[];
        isMultipleChoice?: boolean;
        expiresAt?: string;
      }
    >({
      query: ({ groupId, ...body }) => ({
        url: `/${groupId}/polls`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { groupId }) => [{ type: "GroupPolls", id: groupId }],
    }),
    votePoll: builder.mutation<GroupPoll, { pollId: string; groupId: string; optionIndex: number }>(
      {
        query: ({ groupId, pollId, optionIndex }) => ({
          url: `/${groupId}/polls/${pollId}/vote`,
          method: "POST",
          body: { optionIndex },
        }),
        invalidatesTags: (_result, _error, { groupId }) => [{ type: "GroupPolls", id: groupId }],
        onQueryStarted: async ({ groupId, pollId, optionIndex }, { dispatch, queryFulfilled }) => {
          const patch = dispatch(
            groupPollApi.util.updateQueryData("getGroupPolls", groupId, (draft) => {
              const poll = draft.find((p) => p.id === pollId);
              if (!poll) return;
              const prevVote = poll.userVote;
              const prevVoteEntry = poll.votes.find((v) => v.optionIndex === prevVote);
              if (prevVoteEntry) {
                prevVoteEntry._count = Math.max(0, prevVoteEntry._count - 1);
              }
              const newVoteEntry = poll.votes.find((v) => v.optionIndex === optionIndex);
              if (newVoteEntry) {
                newVoteEntry._count += 1;
              } else {
                poll.votes.push({ optionIndex, _count: 1 });
              }
              poll.userVote = optionIndex;
              if (prevVote === null || prevVote === undefined) {
                poll.totalVotes += 1;
              }
            }),
          );
          try {
            await queryFulfilled;
          } catch {
            patch.undo();
          }
        },
      },
    ),
    unvotePoll: builder.mutation<GroupPoll, { pollId: string; groupId: string }>({
      query: ({ groupId, pollId }) => ({
        url: `/${groupId}/polls/${pollId}/vote`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { groupId }) => [{ type: "GroupPolls", id: groupId }],
      onQueryStarted: async ({ groupId, pollId }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          groupPollApi.util.updateQueryData("getGroupPolls", groupId, (draft) => {
            const poll = draft.find((p) => p.id === pollId);
            if (!poll) return;
            const userVote = poll.userVote;
            if (userVote === null || userVote === undefined) return;
            const voteEntry = poll.votes.find((v) => v.optionIndex === userVote);
            if (voteEntry) {
              voteEntry._count = Math.max(0, voteEntry._count - 1);
            }
            poll.userVote = null;
            poll.totalVotes = Math.max(0, poll.totalVotes - 1);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    deletePoll: builder.mutation<void, { pollId: string; groupId: string }>({
      query: ({ pollId, groupId }) => ({
        url: `/${groupId}/polls/${pollId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { groupId }) => [{ type: "GroupPolls", id: groupId }],
      onQueryStarted: async ({ pollId, groupId }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          groupPollApi.util.updateQueryData("getGroupPolls", groupId, (draft) => {
            const idx = draft.findIndex((p) => p.id === pollId);
            if (idx >= 0) draft.splice(idx, 1);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
  }),
});

export const {
  useGetGroupPollsQuery,
  useCreatePollMutation,
  useVotePollMutation,
  useUnvotePollMutation,
  useDeletePollMutation,
} = groupPollApi;
