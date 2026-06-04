import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import type { StoryGroup, StoryReaction, StoryView } from "@/types/story";

export interface PollResults {
  question?: string;
  options: string[];
  votes: { optionIndex: number; count: number }[];
  totalVotes: number;
  correctOptionIndex?: number;
  userVote: { optionIndex: number } | null;
}

export const storiesApi = createApi({
  reducerPath: "storiesApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/stories`),
  tagTypes: ["Stories", "StoryViews"],
  endpoints: (builder) => ({
    getFriendsStories: builder.query<StoryGroup[], void>({
      query: () => "/friends",
      providesTags: ["Stories"],
      transformResponse: (response: { success: boolean; data: StoryGroup[] }) => response.data,
    }),

    createStory: builder.mutation<
      { id: string } & Record<string, unknown>,
      {
        type?: "media" | "text" | "quiz" | "poll";
        privacy?: "public" | "friends" | "private";
        mediaUrl?: string;
        mediaType?: "image" | "video";
        duration?: number;
        textOverlay?: string;
        textColor?: string;
        textFontSize?: number;
        textFontWeight?: string;
        textPosition?: string;
        backgroundColor?: string;
        stickerData?: {
          type: "quiz" | "poll";
          question?: string;
          options?: string[];
          correctOptionIndex?: number;
          backgroundColor?: string;
        };
      }
    >({
      query: (body) => ({
        url: "/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Stories"],
      transformResponse: (response: {
        success: boolean;
        data: { id: string } & Record<string, unknown>;
      }) => response.data,
      /* eslint-disable @typescript-eslint/no-explicit-any */
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        try {
          const { data: newStory } = await queryFulfilled;
          const s = newStory as Record<string, unknown>;
          const userId = (s.userId ?? (s.user as Record<string, unknown>)?.id) as string | undefined;
          if (!userId) return;
          const userEntry = s.user as { id: string; name: string; username: string; avatar: string | null } | undefined;
          dispatch(
            storiesApi.util.updateQueryData("getFriendsStories", undefined, (draft) => {
              const me = draft.find((g) => g.user.id === userId);
              if (me) {
                me.stories.unshift(newStory as any);
              } else {
                draft.unshift({
                  user: userEntry ?? { id: userId, name: "", username: "", avatar: null },
                  stories: [newStory] as any,
                });
              }
            }),
          );
        } catch {}
      },
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }),

    viewStory: builder.mutation<{ viewed: boolean }, string>({
      query: (storyId) => ({
        url: `/${storyId}/view`,
        method: "POST",
      }),
      invalidatesTags: ["Stories"],
      onQueryStarted: async (storyId, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          storiesApi.util.updateQueryData("getFriendsStories", undefined, (draft) => {
            for (const group of draft) {
              const story = group.stories?.find((s) => s.id === storyId);
              if (story) {
                story.viewed = true;
                break;
              }
            }
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    toggleStoryLike: builder.mutation<{ liked: boolean }, string>({
      query: (storyId) => ({
        url: `/${storyId}/like`,
        method: "POST",
      }),
      invalidatesTags: ["Stories"],
      transformResponse: (response: { success: boolean; data: { liked: boolean } }) =>
        response.data,
      onQueryStarted: async (storyId, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          storiesApi.util.updateQueryData("getFriendsStories", undefined, (draft) => {
            for (const group of draft) {
              const story = group.stories?.find((s) => s.id === storyId);
              if (story) {
                story.liked = !story.liked;
                story.likeCount = (story.likeCount || 0) + (story.liked ? 1 : -1);
                break;
              }
            }
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    reactToStory: builder.mutation<
      { reacted: boolean; emoji: string | null },
      { storyId: string; emoji: string }
    >({
      query: ({ storyId, ...body }) => ({
        url: `/${storyId}/react`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Stories"],
      onQueryStarted: async ({ storyId, emoji }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          storiesApi.util.updateQueryData("getFriendsStories", undefined, (draft) => {
            for (const group of draft) {
              const story = group.stories?.find((s) => s.id === storyId);
              if (story) {
                const wasSame = story.reaction === emoji;
                story.reaction = wasSame ? null : emoji;
                story.reactionCount = (story.reactionCount || 0) + (wasSame ? -1 : 1);
                break;
              }
            }
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    getStoryReactions: builder.query<StoryReaction[], string>({
      query: (storyId) => `/${storyId}/reactions`,
      providesTags: (_result, _error, storyId) => [{ type: "StoryViews", id: storyId }],
      transformResponse: (response: { success: boolean; data: StoryReaction[] }) => response.data,
    }),

    getStoryViews: builder.query<StoryView[], string>({
      query: (storyId) => `/${storyId}/views`,
      providesTags: (_result, _error, storyId) => [{ type: "StoryViews", id: storyId }],
      transformResponse: (response: { success: boolean; data: StoryView[] }) => response.data,
    }),

    deleteStory: builder.mutation<void, string>({
      query: (storyId) => ({
        url: `/${storyId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Stories"],
      onQueryStarted: async (storyId, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          storiesApi.util.updateQueryData("getFriendsStories", undefined, (draft) => {
            for (const group of draft) {
              const idx = group.stories?.findIndex((s) => s.id === storyId);
              if (idx !== undefined && idx >= 0) {
                group.stories.splice(idx, 1);
                break;
              }
            }
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    voteStoryPoll: builder.mutation<PollResults, { storyId: string; optionIndex: number }>({
      query: ({ storyId, ...body }) => ({
        url: `/${storyId}/vote`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Stories"],
      transformResponse: (response: { success: boolean; data: PollResults }) => response.data,
      /* eslint-disable @typescript-eslint/no-explicit-any */
      onQueryStarted: async ({ storyId }, { dispatch, queryFulfilled }) => {
        try {
          const { data: results } = await queryFulfilled;
          if (!results) return;
          dispatch(
            storiesApi.util.updateQueryData("getFriendsStories", undefined, (draft) => {
              for (const group of draft) {
                const story = group.stories?.find((s) => s.id === storyId);
                if (story) {
                  (story as any).pollResults = results;
                  (story as any).pollVoted = true;
                  break;
                }
              }
            }),
          );
        } catch {}
      },
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }),

    getStoryPollResults: builder.query<PollResults, string>({
      query: (storyId) => `/${storyId}/poll-results`,
      providesTags: (_result, _error, storyId) => [{ type: "Stories", id: storyId }],
      transformResponse: (response: { success: boolean; data: PollResults }) => response.data,
    }),
  }),
});

export const {
  useGetFriendsStoriesQuery,
  useCreateStoryMutation,
  useViewStoryMutation,
  useToggleStoryLikeMutation,
  useReactToStoryMutation,
  useGetStoryReactionsQuery,
  useGetStoryViewsQuery,
  useDeleteStoryMutation,
  useVoteStoryPollMutation,
  useGetStoryPollResultsQuery,
} = storiesApi;
