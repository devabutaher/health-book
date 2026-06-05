/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Post, PostFeedData } from "@/types/post";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import type { RootState } from "../store";
import { soundManager } from "@/lib/soundManager";

export const postApi = createApi({
  reducerPath: "postApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/posts`),
  tagTypes: ["Posts", "Post", "Feed", "Saved"],
  endpoints: (builder) => ({
    getFeed: builder.query({
      query: ({ cursor }: { cursor?: string } = {}) => `/feed${cursor ? `?cursor=${cursor}` : ""}`,
      providesTags: ["Feed"],
    }),
    getUserPosts: builder.query({
      query: ({ userId, cursor }: { userId: string; cursor?: string }) =>
        `/user/${userId}${cursor ? `?cursor=${cursor}` : ""}`,
      providesTags: (_result, _error, { userId }) => [
        "Posts",
        { type: "Posts", id: `user-${userId}` },
      ],
      keepUnusedDataFor: 300,
    }),
    getExplore: builder.query({
      query: ({ cursor, category }: { cursor?: string; category?: string } = {}) => {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        if (category && category !== "all") params.set("category", category);
        const qs = params.toString();
        return `/explore${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Posts"],
      keepUnusedDataFor: 600,
    }),
    getPost: builder.query({
      query: (id: string) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Post", id }],
      keepUnusedDataFor: 300,
    }),
    createPost: builder.mutation({
      query: (body: {
        content: string;
        mediaUrls?: string[];
        privacy?: string;
        templateType?: string;
        templateData?: Record<string, unknown>;
        healthLogId?: string;
        groupId?: string;
        isDraft?: boolean;
        scheduledAt?: string | null;
      }) => ({
        url: "/",
        method: "POST",
        body,
      }),
      // Fix: only invalidate group feed if groupId present, not entire Feed
      invalidatesTags: (_result, _error, body) => {
        const tags: any[] = [];
        if (body.groupId) tags.push({ type: "Posts", id: `group-${body.groupId}` });
        return tags;
      },
      onQueryStarted: async (body, { dispatch, queryFulfilled }) => {
        try {
          const { data: res } = await queryFulfilled;
          const newPost = (res as any)?.data;
          if (!newPost) return;
          dispatch(
            postApi.util.updateQueryData("getFeed", { cursor: undefined }, (draft: any) => {
              if (draft?.data?.posts) {
                draft.data.posts.unshift(newPost);
              }
            }),
          );
          if (body.groupId) {
            dispatch(
              postApi.util.updateQueryData(
                "getGroupFeed",
                { groupId: body.groupId },
                (draft: any) => {
                  if (draft?.data?.posts) {
                    draft.data.posts.unshift(newPost);
                  }
                },
              ),
            );
          }
        } catch {}
      },
    }),
    getGroupFeed: builder.query<PostFeedData, { groupId: string; cursor?: string }>({
      query: ({ groupId, cursor }) => `/group/${groupId}${cursor ? `?cursor=${cursor}` : ""}`,
      providesTags: (_result, _error, { groupId }) => [{ type: "Posts", id: `group-${groupId}` }],
      transformResponse: (response: { success: boolean; data: PostFeedData }) => response.data,
    }),
    updatePost: builder.mutation({
      query: ({
        id,
        ...body
      }: {
        id: string;
        content?: string;
        privacy?: string;
        templateType?: string;
        templateData?: Record<string, unknown>;
        healthLogId?: string;
      }) => ({
        url: `/${id}`,
        method: "PUT",
        body,
      }),
      // Only invalidate specific post — not entire Feed/Posts
      invalidatesTags: (_result, _error, { id }) => [{ type: "Post", id }],
      onQueryStarted: async ({ id, ...body }, { dispatch, getState, queryFulfilled }) => {
        // Optimistically update single post cache
        const patchPost = dispatch(
          postApi.util.updateQueryData("getPost", id, (draft: any) => {
            if (!draft) return;
            Object.assign(draft, body);
          }),
        );
        // Also update in feed cache
        const patchFeed = dispatch(
          postApi.util.updateQueryData("getFeed", { cursor: undefined }, (draft: any) => {
            if (!draft?.data?.posts) return;
            const idx = draft.data.posts.findIndex((p: any) => p.id === id);
            if (idx >= 0) Object.assign(draft.data.posts[idx], body);
          }),
        );
        // Look up userId from cached post to also update getUserPosts
        const patches: ReturnType<typeof dispatch>[] = [patchPost, patchFeed];
        try {
          const state = getState();
          const feed = postApi.endpoints.getFeed.select({ cursor: undefined })(state as any)?.data;
          const postOwnerId = feed?.data?.posts?.find((p: any) => p.id === id)?.userId;
          if (postOwnerId) {
            const patchUserPosts = dispatch(
              postApi.util.updateQueryData(
                "getUserPosts",
                { userId: postOwnerId, cursor: undefined },
                (draft: any) => {
                  if (!draft?.data?.posts) return;
                  const idx = draft.data.posts.findIndex((p: any) => p.id === id);
                  if (idx >= 0) Object.assign(draft.data.posts[idx], body);
                },
              ),
            );
            patches.push(patchUserPosts);
          }
          await queryFulfilled;
        } catch {
          patches.forEach((p) => (p as any).undo?.());
          soundManager.playError();
        }
      },
    }),
    deletePost: builder.mutation({
      query: (id: string) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      // Fix: only invalidate specific post tag
      invalidatesTags: (_result, _error, id) => [{ type: "Post", id }],
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        const patches: { undo: () => void }[] = [];
        const apply = (fn: () => void) => {
          try {
            fn();
          } catch {}
        };
        apply(() => {
          const p = dispatch(
            postApi.util.updateQueryData("getFeed", { cursor: undefined }, (draft: any) => {
              if (draft?.data?.posts) {
                draft.data.posts = draft.data.posts.filter((p: any) => p.id !== id);
              }
            }),
          );
          patches.push(p);
        });
        apply(() => {
          const p = dispatch(
            postApi.util.updateQueryData("getSaved", {}, (draft: any) => {
              const target = draft?.data?.posts || draft?.posts;
              if (!target) return;
              const filtered = target.filter((p: any) => p.id !== id);
              if (draft.data) draft.data.posts = filtered;
              else draft.posts = filtered;
            }),
          );
          patches.push(p);
        });
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
          soundManager.playError();
        }
      },
    }),
    toggleReaction: builder.mutation({
      query: ({
        postId,
        type,
      }: {
        postId: string;
        type: "INSPIRED" | "CLAP" | "KEEP_IT_UP" | "HEALING" | "LOVE";
      }) => ({
        url: `/${postId}/reactions`,
        method: "POST",
        body: { type },
      }),
      onQueryStarted: async ({ postId, type }, { dispatch, getState, queryFulfilled }) => {
        const userId = (getState() as RootState).auth.user?.id;
        if (!userId) return;

        const updateReactions = (draft: any) => {
          const reactions = draft?.reactions ?? draft?.data?.reactions;
          if (!reactions) return;
          const existing = reactions.findIndex(
            (r: { userId: string; type: string }) => r.userId === userId,
          );
          if (existing >= 0) {
            if (reactions[existing].type === type) {
              reactions.splice(existing, 1); // toggle off
            } else {
              reactions[existing].type = type; // change type
            }
          } else {
            reactions.push({ userId, type });
          }
        };

        // Update single post cache
        const patchPost = dispatch(
          postApi.util.updateQueryData("getPost", postId, (draft) => {
            updateReactions(draft);
          }),
        );

        // Fix: also update in feed cache
        const patchFeed = dispatch(
          postApi.util.updateQueryData("getFeed", { cursor: undefined }, (draft: any) => {
            if (!draft?.data?.posts) return;
            const post = draft.data.posts.find((p: any) => p.id === postId);
            if (post) updateReactions(post);
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchPost.undo();
          patchFeed.undo();
          soundManager.playError();
        }
      },
    }),
    toggleSave: builder.mutation({
      query: (postId: string) => ({
        url: `/${postId}/save`,
        method: "POST",
      }),
      // Fix: only invalidate Saved list — not Post/Posts
      invalidatesTags: ["Saved"],
      onQueryStarted: async (postId, { dispatch, queryFulfilled }) => {
        const patchPost = dispatch(
          postApi.util.updateQueryData("getPost", postId, (draft) => {
            if (!draft) return;
            (draft as any).isSaved = !(draft as any).isSaved;
          }),
        );
        // Also update in feed
        const patchFeed = dispatch(
          postApi.util.updateQueryData("getFeed", { cursor: undefined }, (draft: any) => {
            if (!draft?.data?.posts) return;
            const post = draft.data.posts.find((p: any) => p.id === postId);
            if (post) post.isSaved = !post.isSaved;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patchPost.undo();
          patchFeed.undo();
          soundManager.playError();
        }
      },
    }),
    getSaved: builder.query({
      query: ({ cursor }: { cursor?: string } = {}) => `/saved${cursor ? `?cursor=${cursor}` : ""}`,
      providesTags: ["Saved"],
      keepUnusedDataFor: 300,
    }),
    getDrafts: builder.query<Post[], void>({
      query: () => "/drafts",
      providesTags: ["Posts"],
      transformResponse: (response: { success: boolean; data: Post[] }) => response.data,
      keepUnusedDataFor: 300,
    }),
    publishDraft: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/publish`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Post", id }],
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        try {
          const { data: res } = await queryFulfilled;
          const publishedPost = (res as any)?.data;
          if (!publishedPost) return;
          dispatch(
            postApi.util.updateQueryData("getFeed", { cursor: undefined }, (draft: any) => {
              if (draft?.data?.posts) {
                draft.data.posts.unshift(publishedPost);
              }
            }),
          );
          dispatch(
            postApi.util.updateQueryData("getDrafts", undefined, (draft: any) => {
              if (draft) {
                const idx = draft.findIndex((p: any) => p.id === id);
                if (idx >= 0) draft.splice(idx, 1);
              }
            }),
          );
        } catch {}
      },
    }),
  }),
});

export const {
  useGetFeedQuery,
  useGetUserPostsQuery,
  useGetExploreQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useToggleReactionMutation,
  useToggleSaveMutation,
  useGetSavedQuery,
  useGetGroupFeedQuery,
  useGetDraftsQuery,
  usePublishDraftMutation,
} = postApi;

export async function uploadPostImage(file: File, token: string): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${process.env["NEXT_PUBLIC_API_URL"]}/api/posts/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Upload failed");
  return json.data.url;
}
