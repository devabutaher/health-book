import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import type { RootState } from "../store";
import type {
  Challenge,
  LeaderboardEntry,
  ChallengeTemplate,
  ChallengeComment,
  ChallengeInvite,
  ChallengeCalendar,
  BeforeAfter,
  ChallengeActivity,
  ChallengeStats,
  Duel,
  ChallengeDifficulty,
  ChallengeDayEntry,
} from "@/types/challenge";

function removeChallengeFromList(list: Challenge[], challengeId: string): Challenge[] {
  return list.filter((c) => c.id !== challengeId);
}

export const challengesApi = createApi({
  reducerPath: "challengesApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/challenges`),
  tagTypes: [
    "Challenges",
    "Challenge",
    "Leaderboard",
    "Comments",
    "Templates",
    "Invites",
    "Activities",
    "Stats",
  ],
  endpoints: (builder) => ({
    browseChallenges: builder.query<
      { challenges: Challenge[]; nextCursor: string | null; hasMore: boolean },
      {
        type?: string;
        category?: string;
        difficulty?: ChallengeDifficulty;
        cursor?: string;
        groupId?: string;
      }
    >({
      query: ({ type, category, difficulty, cursor, groupId }) => {
        const params = new URLSearchParams();
        if (type) params.set("type", type);
        if (category) params.set("category", category);
        if (difficulty) params.set("difficulty", difficulty);
        if (cursor) params.set("cursor", cursor);
        if (groupId) params.set("groupId", groupId);
        const qs = params.toString();
        return qs ? `/?${qs}` : "/";
      },
      providesTags: ["Challenges"],
      keepUnusedDataFor: 600,
      transformResponse: (response: {
        success: boolean;
        data: { challenges: Challenge[]; nextCursor: string | null; hasMore: boolean };
      }) => response.data,
      serializeQueryArgs: ({ queryArgs }) => {
        const { cursor, ...rest } = queryArgs as {
          type?: string;
          category?: string;
          difficulty?: ChallengeDifficulty;
          cursor?: string;
          groupId?: string;
        };
        void cursor;
        return JSON.stringify(rest);
      },
      merge: (currentCache, newItems) => {
        if (!newItems) return;
        if (!currentCache) return newItems;
        const existingIds = new Set(currentCache.challenges.map((c) => c.id));
        return {
          challenges: [
            ...currentCache.challenges,
            ...newItems.challenges.filter((c) => !existingIds.has(c.id)),
          ],
          nextCursor: newItems.nextCursor,
          hasMore: newItems.hasMore,
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return (
          currentArg?.cursor !== previousArg?.cursor ||
          currentArg?.type !== previousArg?.type ||
          currentArg?.category !== previousArg?.category ||
          currentArg?.difficulty !== previousArg?.difficulty ||
          currentArg?.groupId !== previousArg?.groupId
        );
      },
    }),

    searchChallenges: builder.query<
      { challenges: Challenge[]; nextCursor: string | null; hasMore: boolean },
      { q: string; cursor?: string }
    >({
      query: ({ q, cursor }) => {
        const params = new URLSearchParams({ q });
        if (cursor) params.set("cursor", cursor);
        return `/search?${params}`;
      },
      providesTags: ["Challenges"],
      keepUnusedDataFor: 600,
      transformResponse: (response: {
        success: boolean;
        data: { challenges: Challenge[]; nextCursor: string | null; hasMore: boolean };
      }) => response.data,
      serializeQueryArgs: ({ queryArgs }) => {
        const { cursor, ...rest } = queryArgs as { q: string; cursor?: string };
        void cursor;
        return JSON.stringify(rest);
      },
      merge: (currentCache, newItems) => {
        if (!newItems) return;
        if (!currentCache) return newItems;
        const existingIds = new Set(currentCache.challenges.map((c) => c.id));
        return {
          challenges: [
            ...currentCache.challenges,
            ...newItems.challenges.filter((c) => !existingIds.has(c.id)),
          ],
          nextCursor: newItems.nextCursor,
          hasMore: newItems.hasMore,
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return currentArg?.cursor !== previousArg?.cursor || currentArg?.q !== previousArg?.q;
      },
    }),

    getChallenge: builder.query<Challenge, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Challenge", id }],
      transformResponse: (response: { success: boolean; data: Challenge }) => response.data,
      keepUnusedDataFor: 600,
    }),

    createChallenge: builder.mutation<
      Challenge,
      {
        title: string;
        description: string;
        type: string;
        groupId?: string;
        startDate: string;
        endDate: string;
        entryFee?: number;
        prize?: string;
        goalTarget?: number;
        goalUnit?: string;
        category?: string;
        difficulty?: string;
        dayCount?: number;
        milestones?: { name: string; threshold: number; icon: string }[];
        templateId?: string;
      }
    >({
      query: (body) => ({ url: "/", method: "POST", body }),
      invalidatesTags: ["Challenges"],
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try {
          const { data: newChallenge } = await queryFulfilled;
          if (newChallenge) {
            dispatch(
              challengesApi.util.updateQueryData("getMyChallenges", undefined, (draft) => {
                draft.unshift(newChallenge);
              }),
            );
          }
        } catch {
          /* invalidation handles rollback */
        }
      },
    }),

    updateChallenge: builder.mutation<
      Challenge,
      {
        id: string;
        title?: string;
        description?: string;
        type?: string;
        groupId?: string | null;
        startDate?: string;
        endDate?: string;
        entryFee?: number | null;
        prize?: string | null;
        goalTarget?: number | null;
        goalUnit?: string | null;
        category?: string;
        difficulty?: string;
        dayCount?: number;
        milestones?: { name: string; threshold: number; icon: string }[];
      }
    >({
      query: ({ id, ...body }) => ({ url: `/${id}`, method: "PUT", body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Challenge", id }, "Challenges"],
    }),

    joinChallenge: builder.mutation<void, string>({
      query: (id) => ({ url: `/${id}/join`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Challenge", id },
        "Challenges",
        { type: "Leaderboard", id },
        { type: "Activities", id },
      ],
      onQueryStarted: async (challengeId, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          challengesApi.util.updateQueryData("getChallenge", challengeId, (draft) => {
            draft.isJoined = true;
            draft.participantCount = (draft.participantCount || 0) + 1;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    leaveChallenge: builder.mutation<void, string>({
      query: (id) => ({ url: `/${id}/leave`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Challenge", id },
        "Challenges",
        { type: "Leaderboard", id },
      ],
      onQueryStarted: async (challengeId, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          challengesApi.util.updateQueryData("getChallenge", challengeId, (draft) => {
            draft.isJoined = false;
            draft.myProgress = null;
            draft.participantCount = Math.max(0, (draft.participantCount || 1) - 1);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    deleteChallenge: builder.mutation<void, string>({
      query: (id) => ({ url: `/${id}`, method: "DELETE" }),
      invalidatesTags: ["Challenges"],
      onQueryStarted: async (challengeId, { dispatch, getState, queryFulfilled }) => {
        const patches: (() => void)[] = [];
        const currentUser = (getState() as RootState).auth.user;
        if (currentUser) {
          const myPatch = dispatch(
            challengesApi.util.updateQueryData("getMyChallenges", undefined, (draft) => {
              return removeChallengeFromList(draft, challengeId);
            }),
          );
          patches.push(() => myPatch.undo());
        }
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((u) => u());
        }
      },
    }),

    checkIn: builder.mutation<
      ChallengeDayEntry,
      {
        challengeId: string;
        dayNumber: number;
        completed?: boolean;
        notes?: string;
        mediaUrls?: string[];
        sharedToFeed?: boolean;
        value?: number;
      }
    >({
      query: ({ challengeId, ...body }) => ({
        url: `/${challengeId}/check-in`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { challengeId }) => [
        { type: "Challenge", id: challengeId },
        { type: "Leaderboard", id: challengeId },
        { type: "Activities", id: challengeId },
      ],
      onQueryStarted: async (
        { challengeId, dayNumber, completed, value },
        { dispatch, queryFulfilled },
      ) => {
        const patches = [
          dispatch(
            challengesApi.util.updateQueryData("getChallenge", challengeId, (draft) => {
              if (!draft.myProgress) {
                draft.myProgress = {
                  score: 0,
                  goal: draft.dayCount || 30,
                  pct: 0,
                  rank: null,
                  completed: false,
                  streak: 0,
                  achievedMilestones: [],
                  dayEntries: [],
                } as Challenge["myProgress"];
              }
              if (draft.myProgress) {
                if (completed !== false) {
                  draft.myProgress.score = (draft.myProgress.score || 0) + 1;
                }
                draft.myProgress.pct = Math.min(
                  ((draft.myProgress.score || 0) / (draft.myProgress.goal || 30)) * 100,
                  100,
                );
              }
            }),
          ),
          dispatch(
            challengesApi.util.updateQueryData("getCalendar", challengeId, (draft) => {
              const day = draft.days?.find((d) => d.dayNumber === dayNumber);
              if (day) {
                day.completed = completed !== false;
                if (value != null) day.value = value;
                day.completedAt = completed !== false ? new Date().toISOString() : null;
              }
            }),
          ),
        ];
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),

    getCalendar: builder.query<ChallengeCalendar, string>({
      query: (challengeId) => `/${challengeId}/calendar`,
      providesTags: (_result, _error, challengeId) => [{ type: "Challenge", id: challengeId }],
      transformResponse: (response: { success: boolean; data: ChallengeCalendar }) => response.data,
      keepUnusedDataFor: 600,
    }),

    getBeforeAfter: builder.query<BeforeAfter, string>({
      query: (challengeId) => `/${challengeId}/before-after`,
      providesTags: (_result, _error, challengeId) => [{ type: "Challenge", id: challengeId }],
      transformResponse: (response: { success: boolean; data: BeforeAfter }) => response.data,
      keepUnusedDataFor: 600,
    }),

    getActivityFeed: builder.query<
      { activities: ChallengeActivity[]; nextCursor: string | null; hasMore: boolean },
      { challengeId: string; cursor?: string }
    >({
      query: ({ challengeId, cursor }) => {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        const qs = params.toString();
        return `/${challengeId}/activity${qs ? `?${qs}` : ""}`;
      },
      providesTags: (_result, _error, { challengeId }) => [{ type: "Activities", id: challengeId }],
      keepUnusedDataFor: 600,
      transformResponse: (response: {
        success: boolean;
        data: { activities: ChallengeActivity[]; nextCursor: string | null; hasMore: boolean };
      }) => response.data,
      serializeQueryArgs: ({ queryArgs }) => {
        const { cursor, ...rest } = queryArgs as { challengeId: string; cursor?: string };
        void cursor;
        return JSON.stringify(rest);
      },
      merge: (currentCache, newItems) => {
        if (!newItems) return;
        if (!currentCache) return newItems;
        const existingIds = new Set(currentCache.activities.map((a) => a.id));
        return {
          activities: [
            ...currentCache.activities,
            ...newItems.activities.filter((a) => !existingIds.has(a.id)),
          ],
          nextCursor: newItems.nextCursor,
          hasMore: newItems.hasMore,
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return currentArg?.cursor !== previousArg?.cursor;
      },
    }),

    getLeaderboard: builder.query<LeaderboardEntry[], string>({
      query: (challengeId) => `/${challengeId}/leaderboard`,
      providesTags: (_result, _error, challengeId) => [{ type: "Leaderboard", id: challengeId }],
      transformResponse: (response: { success: boolean; data: LeaderboardEntry[] }) =>
        response.data,
      keepUnusedDataFor: 600,
    }),

    getMyChallenges: builder.query<Challenge[], void>({
      query: () => "/mine",
      providesTags: ["Challenges"],
      transformResponse: (response: { success: boolean; data: Challenge[] }) => response.data,
      keepUnusedDataFor: 600,
    }),

    getSavedChallenges: builder.query<Challenge[], void>({
      query: () => "/saved",
      providesTags: ["Challenges"],
      transformResponse: (response: { success: boolean; data: Challenge[] }) => response.data,
      keepUnusedDataFor: 600,
    }),

    toggleSaveChallenge: builder.mutation<{ saved: boolean }, string>({
      query: (id) => ({ url: `/${id}/save`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Challenge", id }, "Challenges"],
      onQueryStarted: async (challengeId, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          challengesApi.util.updateQueryData("getChallenge", challengeId, (draft) => {
            draft.isSaved = !draft.isSaved;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    shareChallenge: builder.mutation<void, { id: string; content?: string }>({
      query: ({ id, ...body }) => ({ url: `/${id}/share`, method: "POST", body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Challenge", id }],
    }),

    getChallengeComments: builder.query<
      { comments: ChallengeComment[]; nextCursor: string | null; hasMore: boolean },
      { challengeId: string; cursor?: string }
    >({
      query: ({ challengeId, cursor }) => {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        const qs = params.toString();
        return `/${challengeId}/comments${qs ? `?${qs}` : ""}`;
      },
      providesTags: (_result, _error, { challengeId }) => [{ type: "Comments", id: challengeId }],
      keepUnusedDataFor: 600,
      transformResponse: (response: {
        success: boolean;
        data: { comments: ChallengeComment[]; nextCursor: string | null; hasMore: boolean };
      }) => response.data,
      serializeQueryArgs: ({ queryArgs }) => {
        const { cursor, ...rest } = queryArgs as { challengeId: string; cursor?: string };
        void cursor;
        return JSON.stringify(rest);
      },
      merge: (currentCache, newItems) => {
        if (!newItems) return;
        if (!currentCache) return newItems;
        const existingIds = new Set(currentCache.comments.map((c) => c.id));
        return {
          comments: [
            ...currentCache.comments,
            ...newItems.comments.filter((c) => !existingIds.has(c.id)),
          ],
          nextCursor: newItems.nextCursor,
          hasMore: newItems.hasMore,
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return currentArg?.cursor !== previousArg?.cursor;
      },
    }),

    addChallengeComment: builder.mutation<
      ChallengeComment,
      { challengeId: string; content: string; parentId?: string }
    >({
      query: ({ challengeId, ...body }) => ({
        url: `/${challengeId}/comments`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { challengeId }) => [
        { type: "Comments", id: challengeId },
        { type: "Activities", id: challengeId },
      ],
      onQueryStarted: async ({ challengeId, content }, { dispatch, getState, queryFulfilled }) => {
        const currentUser = (getState() as RootState).auth.user;
        const optimistic: ChallengeComment = {
          id: `temp-${Date.now()}`,
          challengeId,
          userId: currentUser?.id || "",
          user: {
            id: currentUser?.id || "",
            name: currentUser?.name || "",
            username: currentUser?.username || "",
            avatar: currentUser?.avatar ?? null,
          },
          content,
          parentId: null,
          reactions: [],
          createdAt: new Date().toISOString(),
        };
        const patch = dispatch(
          challengesApi.util.updateQueryData("getChallengeComments", { challengeId }, (draft) => {
            if (!draft?.comments) {
              draft.comments = [];
              draft.nextCursor = null;
              draft.hasMore = false;
            }
            draft.comments.unshift(optimistic);
          }),
        );
        try {
          const { data: real } = await queryFulfilled;
          if (real) {
            dispatch(
              challengesApi.util.updateQueryData(
                "getChallengeComments",
                { challengeId },
                (draft) => {
                  if (!draft?.comments) return;
                  const idx = draft.comments.findIndex((c) => c.id === optimistic.id);
                  if (idx !== -1) {
                    draft.comments[idx] = { ...real, replies: draft.comments[idx]?.replies };
                  }
                },
              ),
            );
          }
        } catch {
          patch.undo();
        }
      },
    }),

    deleteChallengeComment: builder.mutation<void, string>({
      query: (commentId) => ({ url: `/comments/${commentId}`, method: "DELETE" }),
      invalidatesTags: ["Comments"],
    }),

    reactToChallengeComment: builder.mutation<
      { reacted: boolean },
      { commentId: string; type: string }
    >({
      query: ({ commentId, ...body }) => ({
        url: `/comments/${commentId}/react`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Comments"],
    }),

    inviteToChallenge: builder.mutation<void, { challengeId: string; userId: string }>({
      query: ({ challengeId, ...body }) => ({
        url: `/${challengeId}/invite`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Invites"],
    }),

    getMyInvites: builder.query<ChallengeInvite[], void>({
      query: () => "/invites/mine",
      providesTags: ["Invites"],
      transformResponse: (response: { success: boolean; data: ChallengeInvite[] }) => response.data,
      keepUnusedDataFor: 600,
    }),

    respondToInvite: builder.mutation<void, { inviteId: string; accept: boolean }>({
      query: ({ inviteId, ...body }) => ({ url: `/invites/${inviteId}`, method: "PUT", body }),
      invalidatesTags: ["Invites", "Challenges"],
    }),

    getChallengeTemplates: builder.query<ChallengeTemplate[], { category?: string; type?: string }>(
      {
        query: (params) => {
          const p = new URLSearchParams();
          if (params.category) p.set("category", params.category);
          if (params.type) p.set("type", params.type);
          const qs = p.toString();
          return `/templates${qs ? `?${qs}` : ""}`;
        },
        providesTags: ["Templates"],
        transformResponse: (response: { success: boolean; data: ChallengeTemplate[] }) =>
          response.data,
        keepUnusedDataFor: 600,
      },
    ),

    getUserChallengeStats: builder.query<ChallengeStats, string | undefined>({
      query: (userId) => (userId ? `/stats/${userId}` : "/stats"),
      providesTags: ["Stats"],
      transformResponse: (response: { success: boolean; data: ChallengeStats }) => response.data,
      keepUnusedDataFor: 600,
    }),

    createDuel: builder.mutation<
      Challenge,
      {
        title: string;
        description?: string;
        targetUserId: string;
        startDate: string;
        endDate: string;
        goalTarget?: number;
        goalUnit?: string;
        category?: string;
        dayCount?: number;
      }
    >({
      query: (body) => ({ url: "/duel", method: "POST", body }),
      invalidatesTags: ["Challenges"],
    }),

    getDuel: builder.query<Duel, string>({
      query: (id) => `/${id}/duel`,
      providesTags: (_result, _error, id) => [{ type: "Challenge", id }],
      transformResponse: (response: { success: boolean; data: Duel }) => response.data,
      keepUnusedDataFor: 600,
    }),
  }),
});

export const {
  useBrowseChallengesQuery,
  useSearchChallengesQuery,
  useGetChallengeQuery,
  useCreateChallengeMutation,
  useUpdateChallengeMutation,
  useJoinChallengeMutation,
  useLeaveChallengeMutation,
  useDeleteChallengeMutation,
  useCheckInMutation,
  useGetCalendarQuery,
  useGetBeforeAfterQuery,
  useGetActivityFeedQuery,
  useGetLeaderboardQuery,
  useGetMyChallengesQuery,
  useGetSavedChallengesQuery,
  useToggleSaveChallengeMutation,
  useShareChallengeMutation,
  useGetChallengeCommentsQuery,
  useAddChallengeCommentMutation,
  useDeleteChallengeCommentMutation,
  useReactToChallengeCommentMutation,
  useInviteToChallengeMutation,
  useGetMyInvitesQuery,
  useRespondToInviteMutation,
  useGetChallengeTemplatesQuery,
  useGetUserChallengeStatsQuery,
  useCreateDuelMutation,
  useGetDuelQuery,
} = challengesApi;
