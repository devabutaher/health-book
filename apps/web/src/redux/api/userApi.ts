/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import { reelsApi } from "./reelsApi";
import { postApi } from "./postApi";
import type { RootState } from "../store";
import { soundManager } from "@/lib/soundManager";

export interface ProfileData {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  avatar: string | null;
  coverPhoto: string | null;
  isVerified: boolean;
  isFollowing: boolean;
  streak?: number;
  healthScore?: number;
  _count: { posts: number; followers: number; following: number };
  createdAt: string;
}

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
  tagTypes: ["Profile", "Followers", "Following", "Suggested"],
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getProfile: builder.query<ProfileData, string>({
      query: (username) => `/${username}`,
      providesTags: (_result, _error, username) => [{ type: "Profile", id: username }],
      transformResponse: (response: { success: boolean; data: ProfileData }) => response.data,
      keepUnusedDataFor: 300,
    }),
    updateProfile: builder.mutation({
      query: (body: { name?: string; bio?: string; isPrivate?: boolean; gender?: string }) => ({
        url: "/me",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Profile"],
      onQueryStarted: async (body, { dispatch, getState, queryFulfilled }) => {
        const username = (getState() as RootState).auth.user?.username;
        if (!username) return;
        const patch = dispatch(
          userApi.util.updateQueryData("getProfile", username, (draft: any) => {
            if (!draft) return;
            Object.assign(draft, body);
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
              if (draft?._count?.followers !== undefined) {
                draft._count.followers += 1;
              }
            }),
          );
          patches.push(p1);
        }

        // Update current user's following count
        const p2 = dispatch(
          userApi.util.updateQueryData("getProfile", currentUser.username, (draft: any) => {
            if (draft?._count?.following !== undefined) {
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

        // Patch browseReels caches (all cursor variants)
        const reelsQueries = (state as any).reelsApi?.queries ?? {};
        for (const key of Object.keys(reelsQueries)) {
          const q = reelsQueries[key];
          if (q?.endpointName === "browseReels" && q?.status === "fulfilled") {
            const p = dispatch(
              reelsApi.util.updateQueryData("browseReels", q.originalArgs, (draft: any) => {
                draft.reels.forEach((reel: any) => {
                  if (reel.user.id === userId) reel.user.isFollowing = true;
                });
              }),
            );
            patches.push(p);
          }
        }

        // Patch feed caches (all cursor variants)
        const feedQueries = (state as any).postApi?.queries ?? {};
        for (const key of Object.keys(feedQueries)) {
          const q = feedQueries[key];
          if (q?.endpointName === "getFeed" && q?.status === "fulfilled") {
            const p = dispatch(
              postApi.util.updateQueryData("getFeed", q.originalArgs, (draft: any) => {
                draft?.data?.posts?.forEach((post: any) => {
                  if (post.user?.id === userId) post.user.isFollowing = true;
                });
              }),
            );
            patches.push(p);
          }
          if (q?.endpointName === "getUserPosts" && q?.status === "fulfilled") {
            const p = dispatch(
              postApi.util.updateQueryData("getUserPosts", q.originalArgs, (draft: any) => {
                draft?.data?.posts?.forEach((post: any) => {
                  if (post.user?.id === userId) post.user.isFollowing = true;
                });
              }),
            );
            patches.push(p);
          }
          if (q?.endpointName === "getExplore" && q?.status === "fulfilled") {
            const p = dispatch(
              postApi.util.updateQueryData("getExplore", q.originalArgs, (draft: any) => {
                draft?.data?.posts?.forEach((post: any) => {
                  if (post.user?.id === userId) post.user.isFollowing = true;
                });
              }),
            );
            patches.push(p);
          }
        }

        try {
          await queryFulfilled;
        } catch {
          soundManager.playError();
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
              if (draft?._count?.followers !== undefined) {
                draft._count.followers = Math.max(0, draft._count.followers - 1);
              }
            }),
          );
          patches.push(p1);
        }

        // Update current user's following count
        const p2 = dispatch(
          userApi.util.updateQueryData("getProfile", currentUser.username, (draft: any) => {
            if (draft?._count?.following !== undefined) {
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

        // Patch browseReels caches (all cursor variants)
        const reelsQueries2 = (state as any).reelsApi?.queries ?? {};
        for (const key of Object.keys(reelsQueries2)) {
          const q = reelsQueries2[key];
          if (q?.endpointName === "browseReels" && q?.status === "fulfilled") {
            const p = dispatch(
              reelsApi.util.updateQueryData("browseReels", q.originalArgs, (draft: any) => {
                draft.reels.forEach((reel: any) => {
                  if (reel.user.id === userId) reel.user.isFollowing = false;
                });
              }),
            );
            patches.push(p);
          }
        }

        // Patch feed caches (all cursor variants)
        const feedQueries2 = (state as any).postApi?.queries ?? {};
        for (const key of Object.keys(feedQueries2)) {
          const q = feedQueries2[key];
          if (q?.endpointName === "getFeed" && q?.status === "fulfilled") {
            const p = dispatch(
              postApi.util.updateQueryData("getFeed", q.originalArgs, (draft: any) => {
                draft?.data?.posts?.forEach((post: any) => {
                  if (post.user?.id === userId) post.user.isFollowing = false;
                });
              }),
            );
            patches.push(p);
          }
          if (q?.endpointName === "getUserPosts" && q?.status === "fulfilled") {
            const p = dispatch(
              postApi.util.updateQueryData("getUserPosts", q.originalArgs, (draft: any) => {
                draft?.data?.posts?.forEach((post: any) => {
                  if (post.user?.id === userId) post.user.isFollowing = false;
                });
              }),
            );
            patches.push(p);
          }
          if (q?.endpointName === "getExplore" && q?.status === "fulfilled") {
            const p = dispatch(
              postApi.util.updateQueryData("getExplore", q.originalArgs, (draft: any) => {
                draft?.data?.posts?.forEach((post: any) => {
                  if (post.user?.id === userId) post.user.isFollowing = false;
                });
              }),
            );
            patches.push(p);
          }
        }

        try {
          await queryFulfilled;
        } catch {
          soundManager.playError();
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
      onQueryStarted: async (_body, { dispatch, getState, queryFulfilled }) => {
        const username = (getState() as RootState).auth.user?.username;
        if (!username) return;
        try {
          const { data: res } = await queryFulfilled;
          const avatar = (res as any)?.data?.avatar;
          if (!avatar) return;
          dispatch(
            userApi.util.updateQueryData("getProfile", username, (draft: any) => {
              if (draft) draft.avatar = avatar;
            }),
          );
        } catch {
          soundManager.playError();
        }
      },
    }),
    uploadCover: builder.mutation({
      query: (body: FormData) => ({
        url: "/me/cover",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Profile"],
      onQueryStarted: async (_body, { dispatch, getState, queryFulfilled }) => {
        const username = (getState() as RootState).auth.user?.username;
        if (!username) return;
        try {
          const { data: res } = await queryFulfilled;
          const coverPhoto = (res as any)?.data?.coverPhoto;
          if (!coverPhoto) return;
          dispatch(
            userApi.util.updateQueryData("getProfile", username, (draft: any) => {
              if (draft) draft.coverPhoto = coverPhoto;
            }),
          );
        } catch {
          soundManager.playError();
        }
      },
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
