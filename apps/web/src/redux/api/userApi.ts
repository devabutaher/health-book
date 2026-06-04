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
      invalidatesTags: ["Profile", "Followers", "Following", "Suggested", "Reels"],
      onQueryStarted: async (userId, { dispatch, getState, queryFulfilled }) => {
        const currentUser = (getState() as RootState).auth.user;
        if (!currentUser) return;
        const profilePatch = dispatch(
          userApi.util.updateQueryData("getProfile", currentUser.username, (draft) => {
            if (draft.isFollowing === false) draft.isFollowing = true;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          profilePatch.undo();
        }
      },
    }),
    unfollow: builder.mutation({
      query: (userId: string) => ({
        url: `/${userId}/follow`,
        method: "DELETE",
      }),
      invalidatesTags: ["Profile", "Followers", "Following", "Suggested", "Reels"],
      onQueryStarted: async (userId, { dispatch, getState, queryFulfilled }) => {
        const currentUser = (getState() as RootState).auth.user;
        if (!currentUser) return;
        const profilePatch = dispatch(
          userApi.util.updateQueryData("getProfile", currentUser.username, (draft) => {
            if (draft.isFollowing === true) draft.isFollowing = false;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          profilePatch.undo();
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
      providesTags: ["Followers"],
    }),
    getFollowing: builder.query({
      query: ({ userId, cursor }: { userId: string; cursor?: string }) =>
        `/${userId}/following${cursor ? `?cursor=${cursor}` : ""}`,
      providesTags: ["Following"],
    }),
    getSuggested: builder.query<SuggestedUser[], void>({
      query: () => "/suggested",
      providesTags: ["Suggested"],
      transformResponse: (response: { success: boolean; data: SuggestedUser[] }) => response.data,
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
