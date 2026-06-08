import type { StoryGroup, StoryInteractions, StorySticker } from "@/types/story";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import { soundManager } from "@/lib/soundManager";

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
  tagTypes: ["Stories"],
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getFriendsStories: builder.query<StoryGroup[], void>({
      query: () => "/friends",
      providesTags: ["Stories"],
      transformResponse: (response: { success: boolean; data: StoryGroup[] }) => response.data,
      keepUnusedDataFor: 300,
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
        textBgColor?: string;
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
      query: (body) => ({ url: "/", method: "POST", body }),
      invalidatesTags: ["Stories"],
      transformResponse: (response: {
        success: boolean;
        data: { id: string } & Record<string, unknown>;
      }) => response.data,
      onQueryStarted: async (args, { getState, dispatch, queryFulfilled }) => {
        const currentUserId = (getState() as { auth?: { user?: { id: string } } }).auth?.user?.id;
        if (!currentUserId) return;
        const tempId = `temp-${Date.now()}`;

        const patch = dispatch(
          storiesApi.util.updateQueryData("getFriendsStories", undefined, (draft) => {
            const myGroup = draft.find((g) => g.user.id === currentUserId);
            if (!myGroup) return;
            myGroup.stories.unshift({
              id: tempId,
              userId: currentUserId,
              user: { id: currentUserId, name: "", username: "", avatar: null },
              type: args.type || "media",
              mediaUrl: args.mediaUrl || null,
              mediaType: (args.mediaType as "image" | "video" | null) || null,
              duration: args.duration || null,
              textOverlay: args.textOverlay || null,
              stickerData: args.stickerData as StorySticker | undefined,
              backgroundColor: args.backgroundColor || undefined,
              viewed: false,
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 86400000).toISOString(),
            });
          }),
        );

        try {
          const { data: newStory } = (await queryFulfilled) as unknown as {
            data: { id: string } & Record<string, unknown>;
          };
          if (!newStory?.id) return;
          dispatch(
            storiesApi.util.updateQueryData("getFriendsStories", undefined, (draft) => {
              const myGroup = draft.find((g) => g.user.id === currentUserId);
              if (!myGroup) return;
              const idx = myGroup.stories.findIndex((s) => s.id === tempId);
              if (idx >= 0) myGroup.stories[idx].id = newStory.id;
            }),
          );
        } catch {
          patch.undo();
          soundManager.playError();
        }
      },
    }),

    viewStory: builder.mutation<{ viewed: boolean }, string>({
      query: (storyId) => ({ url: `/${storyId}/view`, method: "POST" }),
      // No invalidateTags — optimistic only, no refetch needed
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
          soundManager.playError();
          patch.undo();
        }
      },
    }),

    reactToStory: builder.mutation<
      { reacted: boolean; emoji: string | null },
      { storyId: string; emoji: string }
    >({
      query: ({ storyId, ...body }) => ({ url: `/${storyId}/react`, method: "POST", body }),
      // No invalidateTags — optimistic handles it
      onQueryStarted: async ({ storyId, emoji }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          storiesApi.util.updateQueryData("getFriendsStories", undefined, (draft) => {
            for (const group of draft) {
              const story = group.stories?.find((s) => s.id === storyId);
              if (story) {
                const wasSame = story.reaction === emoji;
                story.reaction = wasSame ? null : emoji;
                story.reactionCount = Math.max(0, (story.reactionCount || 0) + (wasSame ? -1 : 1));
                break;
              }
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

    getStoryInteractions: builder.query<StoryInteractions, string>({
      query: (storyId) => `/${storyId}/interactions`,
      transformResponse: (response: { success: boolean; data: StoryInteractions }) => response.data,
      providesTags: (_result, _error, storyId) => [{ type: "Stories", id: storyId }],
      keepUnusedDataFor: 60,
    }),

    deleteStory: builder.mutation<void, string>({
      query: (storyId) => ({ url: `/${storyId}`, method: "DELETE" }),
      // No invalidateTags — optimistic handles it
      onQueryStarted: async (storyId, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          storiesApi.util.updateQueryData("getFriendsStories", undefined, (draft) => {
            for (let i = 0; i < draft.length; i++) {
              const group = draft[i];
              const idx = group.stories?.findIndex((s) => s.id === storyId);
              if (idx !== undefined && idx >= 0) {
                group.stories.splice(idx, 1);
                if (group.stories.length === 0) {
                  draft.splice(i, 1);
                }
                break;
              }
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

    voteStoryPoll: builder.mutation<PollResults, { storyId: string; optionIndex: number }>({
      query: ({ storyId, ...body }) => ({ url: `/${storyId}/vote`, method: "POST", body }),
      transformResponse: (response: { success: boolean; data: PollResults }) => response.data,
      onQueryStarted: async ({ storyId, optionIndex }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          storiesApi.util.updateQueryData("getStoryPollResults", storyId, (draft) => {
            if (!draft) return;
            const option = draft.options[optionIndex];
            if (!option) return;
            if (draft.userVote) {
              const prevIdx = draft.userVote.optionIndex;
              if (draft.options[prevIdx]) {
                draft.votes = draft.votes.map((v) =>
                  v.optionIndex === prevIdx ? { ...v, count: Math.max(0, v.count - 1) } : v,
                );
              }
            }
            draft.votes = draft.votes.map((v) =>
              v.optionIndex === optionIndex ? { ...v, count: v.count + 1 } : v,
            );
            draft.totalVotes += draft.userVote ? 0 : 1;
            draft.userVote = { optionIndex };
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
  useReactToStoryMutation,

  useGetStoryInteractionsQuery,
  useDeleteStoryMutation,
  useVoteStoryPollMutation,
} = storiesApi;
