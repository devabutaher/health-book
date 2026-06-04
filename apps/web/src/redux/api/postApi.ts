/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import type { RootState } from "../store";
import type { Post, PostFeedData } from "@/types/post";

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
    }),
    getPost: builder.query({
      query: (id: string) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Post", id }],
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
      invalidatesTags: (_result, _error, body) => {
        const tags: ("Feed" | "Posts" | { type: "Posts"; id: string })[] = ["Feed", "Posts"];
        if (body.groupId) tags.push({ type: "Posts", id: `group-${body.groupId}` });
        return tags;
      },
      onQueryStarted: async (_body, { dispatch, queryFulfilled }) => {
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
      invalidatesTags: (_result, _error, { id }) => [{ type: "Post", id }, "Feed", "Posts"],
      onQueryStarted: async ({ id, ...body }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          postApi.util.updateQueryData("getPost", id, (draft: any) => {
            if (!draft) return;
            Object.assign(draft, body);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    deletePost: builder.mutation({
      query: (id: string) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Post", id }, "Feed", "Posts"],
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
      invalidatesTags: (_result, _error, { postId }) => [
        { type: "Post", id: postId },
        "Feed",
        "Posts",
      ],
      onQueryStarted: async ({ postId, type }, { dispatch, getState, queryFulfilled }) => {
        const userId = (getState() as RootState).auth.user?.id;
        if (!userId) return;
        const patch = dispatch(
          postApi.util.updateQueryData("getPost", postId, (draft) => {
            const existing =
              draft.reactions?.findIndex(
                (r: { userId: string; type: string }) => r.userId === userId,
              ) ?? -1;
            if (existing >= 0) {
              draft.reactions!.splice(existing, 1);
            } else {
              if (!draft.reactions) draft.reactions = [];
              draft.reactions.push({ userId, type });
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
    toggleSave: builder.mutation({
      query: (postId: string) => ({
        url: `/${postId}/save`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, postId) => [
        { type: "Post", id: postId },
        "Saved",
        "Posts",
      ],
      onQueryStarted: async (postId, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          postApi.util.updateQueryData("getPost", postId, (draft) => {
            if (!draft) return;
            (draft as any).isSaved = !(draft as any).isSaved;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    getSaved: builder.query({
      query: ({ cursor }: { cursor?: string } = {}) => `/saved${cursor ? `?cursor=${cursor}` : ""}`,
      providesTags: ["Saved"],
    }),
    getDrafts: builder.query<Post[], void>({
      query: () => "/drafts",
      providesTags: ["Posts"],
      transformResponse: (response: { success: boolean; data: Post[] }) => response.data,
    }),
    publishDraft: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/publish`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Post", id }, "Feed", "Posts"],
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
