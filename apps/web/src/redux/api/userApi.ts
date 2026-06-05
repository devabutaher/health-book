/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import type { RootState } from "../store";

export interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  isVerified: boolean;
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/users`),
  tagTypes: ["Profile", "Followers", "Following", "Suggested", "Feed", "Reels"],
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: (username: string) => `/${username}`,
      providesTags: (_result, _error, username) => [{ type: "Profile", id: username }],
      keepUnusedDataFor: 300,
    }),
    updateProfile: builder.mutation({
      query: (body: { name?: string; bio?: string; isPrivate?: boolean }) => ({
        url: "/me",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Profile"],
    }),
    follow: builder.mutation({
      query: (userId: string) => ({
        url: `/${userId}/follow`,
        method: "POST",
      }),
      // Fix: only invalidate specific tags — not Reels
      invalidatesTags: ["Suggested"],
      onQueryStarted: async (userId, { dispatch, getState, queryFulfilled }) => {
        const state = getState() as RootState;
        const currentUser = state.auth.user;
        if (!currentUser) return;

        const patches: { undo: () => void }[] = [];

        // Fix: find the target user's username from cached profiles
        // Try all cached profile queries to find this userId
        const allQueries = (state as any).userApi?.queries ?? {};
        let targetUsername: string | null = null;
        for (const key of Object.keys(allQueries)) {
          const entry = allQueries[key];
          if (entry?.data?.id === userId) {
            targetUsername = entry.data.username;
            break;
          }
        }

        // Update target user's profile — isFollowing: true, follower count +1
        if (targetUsername) {
          const p1 = dispatch(
            userApi.util.updateQueryData("getProfile", targetUsername, (draft: any) => {
              draft.isFollowing = true;
              if (draft._count?.followers !== undefined) {
                draft._count.followers += 1;
              }
            }),
          );
          patches.push(p1);
        }

        // Update current user's following count
        const p2 = dispatch(
          userApi.util.updateQueryData("getProfile", currentUser.username, (draft: any) => {
            if (draft._count?.following !== undefined) {
              draft._count.following += 1;
            }
          }),
        );
        patches.push(p2);

        // Update suggested users list
        const p3 = dispatch(
          userApi.util.updateQueryData("getSuggested", undefined, (draft) => {
            const user = draft.find((u) => u.id === userId);
            if (user) (user as any).isFollowing = true;
          }),
        );
        patches.push(p3);

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),
    unfollow: builder.mutation({
      query: (userId: string) => ({
        url: `/${userId}/follow`,
        method: "DELETE",
      }),
      // Fix: only invalidate specific tags — not Reels
      invalidatesTags: ["Suggested"],
      onQueryStarted: async (userId, { dispatch, getState, queryFulfilled }) => {
        const state = getState() as RootState;
        const currentUser = state.auth.user;
        if (!currentUser) return;

        const patches: { undo: () => void }[] = [];

        // Find target user's username from cached profiles
        const allQueries = (state as any).userApi?.queries ?? {};
        let targetUsername: string | null = null;
        for (const key of Object.keys(allQueries)) {
          const entry = allQueries[key];
          if (entry?.data?.id === userId) {
            targetUsername = entry.data.username;
            break;
          }
        }

        // Update target user's profile — isFollowing: false, follower count -1
        if (targetUsername) {
          const p1 = dispatch(
            userApi.util.updateQueryData("getProfile", targetUsername, (draft: any) => {
              draft.isFollowing = false;
              if (draft._count?.followers !== undefined) {
                draft._count.followers = Math.max(0, draft._count.followers - 1);
              }
            }),
          );
          patches.push(p1);
        }

        // Update current user's following count
        const p2 = dispatch(
          userApi.util.updateQueryData("getProfile", currentUser.username, (draft: any) => {
            if (draft._count?.following !== undefined) {
              draft._count.following = Math.max(0, draft._count.following - 1);
            }
          }),
        );
        patches.push(p2);

        // Update suggested users list
        const p3 = dispatch(
          userApi.util.updateQueryData("getSuggested", undefined, (draft) => {
            const user = draft.find((u) => u.id === userId);
            if (user) (user as any).isFollowing = false;
          }),
        );
        patches.push(p3);

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),
    uploadAvatar: builder.mutation({
      query: (body: FormData) => ({
        url: "/me/avatar",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Profile"],
    }),
    uploadCover: builder.mutation({
      query: (body: FormData) => ({
        url: "/me/cover",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Profile"],
    }),
    getFollowers: builder.query({
      query: ({ userId, cursor }: { userId: string; cursor?: string }) =>
        `/${userId}/followers${cursor ? `?cursor=${cursor}` : ""}`,
      providesTags: [{ type: "Followers" as const, id: "LIST" }],
      keepUnusedDataFor: 300,
    }),
    getFollowing: builder.query({
      query: ({ userId, cursor }: { userId: string; cursor?: string }) =>
        `/${userId}/following${cursor ? `?cursor=${cursor}` : ""}`,
      providesTags: [{ type: "Following" as const, id: "LIST" }],
      keepUnusedDataFor: 300,
    }),
    getSuggested: builder.query<SuggestedUser[], void>({
      query: () => "/suggested",
      providesTags: ["Suggested"],
      transformResponse: (response: { success: boolean; data: SuggestedUser[] }) => response.data,
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useUploadCoverMutation,
  useFollowMutation,
  useUnfollowMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useGetSuggestedQuery,
} = userApi;
