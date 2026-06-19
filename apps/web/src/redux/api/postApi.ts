/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Post, PostFeedData, PostPrivacy } from "@/types/post";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import type { RootState } from "../store";
import { soundManager } from "@/lib/soundManager";
import { updateReaction as feedUpdateReaction } from "../slices/feedSlice";

export const postApi = createApi({
  reducerPath: "postApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/posts`),
  tagTypes: ["Posts", "Post", "Saved", "Drafts"],
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getFeed: builder.query({
      query: ({ cursor }: { cursor?: string } = {}) => `/feed${cursor ? `?cursor=${cursor}` : ""}`,
      providesTags: ["Posts"],
      keepUnusedDataFor: 600,
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
      invalidatesTags: () => [],
      onQueryStarted: async (body, { dispatch, queryFulfilled, getState }) => {
        const user = (getState() as RootState).auth.user;
        if (!user) {
          try {
            await queryFulfilled;
          } catch {
            soundManager.playError();
          }
          return;
        }

        const tempId = `temp-${Date.now()}`;
        const optimisticPost: Post = {
          id: tempId,
          content: body.content ?? null,
          mediaUrls: body.mediaUrls || [],
          privacy: (body.privacy as PostPrivacy) || "PUBLIC",
          userId: user.id,
          groupId: body.groupId || null,
          templateType: body.templateType || null,
          templateData: (body.templateData as Record<string, unknown>) || null,
          healthLogId: body.healthLogId || null,
          isDraft: !!body.isDraft,
          scheduledAt: body.scheduledAt || null,
          publishedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            avatar: user.avatar,
            isVerified: (user as any).isVerified ?? false,
            isFollowing: false,
          },
          _count: { reactions: 0, comments: 0 },
          reactions: [],
          isSaved: false,
          healthLog: null,
          poll: null,
        };

        const patches: { undo: () => void }[] = [];

        if (body.isDraft) {
          // Optimistic insert into drafts cache
          const p = dispatch(
            postApi.util.updateQueryData("getDrafts", undefined, (draft: any) => {
              if (draft) draft.unshift(optimisticPost);
            }),
          );
          patches.push(p);
        } else {
          // Optimistic insert into all getFeed caches (all paginated pages)
          const queries = (getState() as any).postApi?.queries ?? {};
          for (const key of Object.keys(queries)) {
            const q = queries[key];
            if (q?.endpointName === "getFeed" && q?.status === "fulfilled") {
              const p = dispatch(
                postApi.util.updateQueryData("getFeed", q.originalArgs, (draft: any) => {
                  if (draft?.data?.posts) {
                    draft.data.posts.unshift(optimisticPost);
                  }
                }),
              );
              patches.push(p);
            }
            // Also patch getUserPosts for the current user
            if (q?.endpointName === "getUserPosts" && q?.status === "fulfilled") {
              const args = q.originalArgs as { userId: string; cursor?: string } | undefined;
              if (args?.userId === user.id) {
                const p = dispatch(
                  postApi.util.updateQueryData("getUserPosts", q.originalArgs, (draft: any) => {
                    if (draft?.data?.posts) {
                      draft.data.posts.unshift(optimisticPost);
                    }
                  }),
                );
                patches.push(p);
              }
            }
            if (q?.endpointName === "getExplore" && q?.status === "fulfilled") {
              const p = dispatch(
                postApi.util.updateQueryData("getExplore", q.originalArgs, (draft: any) => {
                  if (draft?.data?.posts) {
                    draft.data.posts.unshift(optimisticPost);
                  }
                }),
              );
              patches.push(p);
            }
          }
          // Optimistic insert into getGroupFeed if applicable
          if (body.groupId) {
            const p = dispatch(
              postApi.util.updateQueryData(
                "getGroupFeed",
                { groupId: body.groupId },
                (draft: any) => {
                  if (draft?.data?.posts) {
                    draft.data.posts.unshift(optimisticPost);
                  }
                },
              ),
            );
            patches.push(p);
          }
        }

        try {
          const { data: res } = await queryFulfilled;
          const newPost = (res as any)?.data;
          if (newPost?.id && newPost.id !== tempId) {
            // Replace tempId with real server ID across all cached queries
            const replaceInPosts = (draft: any) => {
              if (!draft) return;
              if (draft.data?.posts) {
                const idx = draft.data.posts.findIndex((p: any) => p.id === tempId);
                if (idx >= 0) draft.data.posts[idx].id = newPost.id;
              }
              if (Array.isArray(draft)) {
                const idx = draft.findIndex((p: any) => p.id === tempId);
                if (idx >= 0) draft[idx].id = newPost.id;
              }
            };
            const queries = (getState() as any).postApi?.queries ?? {};
            for (const key of Object.keys(queries)) {
              const q = queries[key];
              if (
                q?.status === "fulfilled" &&
                ["getFeed", "getUserPosts", "getGroupFeed", "getDrafts"].includes(q.endpointName)
              ) {
                dispatch(
                  postApi.util.updateQueryData(q.endpointName, q.originalArgs, replaceInPosts),
                );
              }
            }
          }
        } catch {
          patches.forEach((p) => p.undo());
          soundManager.playError();
        }
      },
    }),
    getGroupFeed: builder.query<PostFeedData, { groupId: string; cursor?: string }>({
      query: ({ groupId, cursor }) => `/group/${groupId}${cursor ? `?cursor=${cursor}` : ""}`,
      providesTags: (_result, _error, { groupId }) => [{ type: "Posts", id: `group-${groupId}` }],
      transformResponse: (response: { success: boolean; data: PostFeedData }) => response.data,
      keepUnusedDataFor: 300,
    }),
    updatePost: builder.mutation({
      query: ({
        id,
        ...body
      }: {
        id: string;
        content?: string;
        privacy?: string;
        mediaUrls?: string[];
        templateType?: string;
        templateData?: Record<string, unknown>;
        healthLogId?: string;
      }) => ({
        url: `/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: () => [],
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
        const patches: { undo: () => void }[] = [patchPost, patchFeed];
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
          patches.forEach((p) => p.undo());
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
      onQueryStarted: async (id, { dispatch, getState, queryFulfilled }) => {
        const patches: { undo: () => void }[] = [];
        const state = getState() as any;
        const queries = state?.postApi?.queries ?? {};
        for (const key of Object.keys(queries)) {
          const q = queries[key];
          if (q?.endpointName === "getFeed" && q?.status === "fulfilled") {
            const p = dispatch(
              postApi.util.updateQueryData("getFeed", q.originalArgs, (draft: any) => {
                if (draft?.data?.posts) {
                  draft.data.posts = draft.data.posts.filter((p: any) => p.id !== id);
                }
              }),
            );
            patches.push(p);
          }
          if (q?.endpointName === "getUserPosts" && q?.status === "fulfilled") {
            const p = dispatch(
              postApi.util.updateQueryData("getUserPosts", q.originalArgs, (draft: any) => {
                if (draft?.data?.posts) {
                  draft.data.posts = draft.data.posts.filter((p: any) => p.id !== id);
                }
              }),
            );
            patches.push(p);
          }
          if (q?.endpointName === "getExplore" && q?.status === "fulfilled") {
            const p = dispatch(
              postApi.util.updateQueryData("getExplore", q.originalArgs, (draft: any) => {
                if (draft?.data?.posts) {
                  draft.data.posts = draft.data.posts.filter((p: any) => p.id !== id);
                }
              }),
            );
            patches.push(p);
          }
          if (q?.endpointName === "getSaved" && q?.status === "fulfilled") {
            const p = dispatch(
              postApi.util.updateQueryData("getSaved", q.originalArgs, (draft: any) => {
                const target = draft?.data?.posts || draft?.posts;
                if (!target) return;
                const filtered = target.filter((p: any) => p.id !== id);
                if (draft.data) draft.data.posts = filtered;
                else draft.posts = filtered;
              }),
            );
            patches.push(p);
          }
        }
        // Also remove from drafts
        const dp = dispatch(
          postApi.util.updateQueryData("getDrafts", undefined, (draft: any) => {
            if (!draft) return;
            const idx = draft.findIndex((p: any) => p.id === id);
            if (idx >= 0) draft.splice(idx, 1);
          }),
        );
        patches.push(dp);
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
          soundManager.playError();
        }
      },
    }),
    toggleReaction: builder.mutation({
      invalidatesTags: (_result, _error, { postId }) => [{ type: "Post", id: postId }, "Posts"],
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
          const isDataLevel = !!draft?.data?.reactions;
          const countObj = isDataLevel ? draft?.data?._count : draft?._count;
          const existing = reactions.findIndex(
            (r: { userId: string; type: string }) => r.userId === userId,
          );
          if (existing >= 0) {
            if (reactions[existing].type === type) {
              reactions.splice(existing, 1);
              if (countObj?.reactions !== undefined) countObj.reactions -= 1;
            } else {
              reactions[existing].type = type;
            }
          } else {
            reactions.push({ userId, type });
            if (countObj?.reactions !== undefined) countObj.reactions += 1;
          }
        };

        const patches: { undo: () => void }[] = [];

        // Update single post cache
        patches.push(
          dispatch(
            postApi.util.updateQueryData("getPost", postId, (draft) => {
              updateReactions(draft);
            }),
          ),
        );

        // Loop through all cached queries to patch feed and user posts
        const state = getState() as any;
        const queries = state?.postApi?.queries ?? {};
        for (const key of Object.keys(queries)) {
          const q = queries[key];
          if (q?.endpointName === "getFeed" && q?.status === "fulfilled") {
            patches.push(
              dispatch(
                postApi.util.updateQueryData("getFeed", q.originalArgs, (draft: any) => {
                  if (!draft?.data?.posts) return;
                  const post = draft.data.posts.find((p: any) => p.id === postId);
                  if (post) updateReactions(post);
                }),
              ),
            );
          }
          if (q?.endpointName === "getUserPosts" && q?.status === "fulfilled") {
            patches.push(
              dispatch(
                postApi.util.updateQueryData("getUserPosts", q.originalArgs, (draft: any) => {
                  if (!draft?.data?.posts) return;
                  const post = draft.data.posts.find((p: any) => p.id === postId);
                  if (post) updateReactions(post);
                }),
              ),
            );
          }
          if (q?.endpointName === "getGroupFeed" && q?.status === "fulfilled") {
            patches.push(
              dispatch(
                postApi.util.updateQueryData("getGroupFeed", q.originalArgs, (draft: any) => {
                  if (!draft?.data?.posts) return;
                  const post = draft.data.posts.find((p: any) => p.id === postId);
                  if (post) updateReactions(post);
                }),
              ),
            );
          }
          if (q?.endpointName === "getExplore" && q?.status === "fulfilled") {
            patches.push(
              dispatch(
                postApi.util.updateQueryData("getExplore", q.originalArgs, (draft: any) => {
                  if (!draft?.data?.posts) return;
                  const post = draft.data.posts.find((p: any) => p.id === postId);
                  if (post) updateReactions(post);
                }),
              ),
            );
          }
        }

        // Also update feed Redux slice directly (bypasses local state bridge)
        dispatch(feedUpdateReaction({ postId, userId, type }));

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
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
      onQueryStarted: async (postId, { dispatch, getState, queryFulfilled }) => {
        const patches: { undo: () => void }[] = [];

        patches.push(
          dispatch(
            postApi.util.updateQueryData("getPost", postId, (draft) => {
              if (!draft) return;
              (draft as any).isSaved = !(draft as any).isSaved;
            }),
          ),
        );

        // Loop through all cached queries to patch feed and user posts
        const state = getState() as any;
        const queries = state?.postApi?.queries ?? {};
        for (const key of Object.keys(queries)) {
          const q = queries[key];
          if (q?.endpointName === "getFeed" && q?.status === "fulfilled") {
            patches.push(
              dispatch(
                postApi.util.updateQueryData("getFeed", q.originalArgs, (draft: any) => {
                  if (!draft?.data?.posts) return;
                  const post = draft.data.posts.find((p: any) => p.id === postId);
                  if (post) post.isSaved = !post.isSaved;
                }),
              ),
            );
          }
          if (q?.endpointName === "getUserPosts" && q?.status === "fulfilled") {
            patches.push(
              dispatch(
                postApi.util.updateQueryData("getUserPosts", q.originalArgs, (draft: any) => {
                  if (!draft?.data?.posts) return;
                  const post = draft.data.posts.find((p: any) => p.id === postId);
                  if (post) post.isSaved = !post.isSaved;
                }),
              ),
            );
          }
          if (q?.endpointName === "getExplore" && q?.status === "fulfilled") {
            patches.push(
              dispatch(
                postApi.util.updateQueryData("getExplore", q.originalArgs, (draft: any) => {
                  if (!draft?.data?.posts) return;
                  const post = draft.data.posts.find((p: any) => p.id === postId);
                  if (post) post.isSaved = !post.isSaved;
                }),
              ),
            );
          }
        }

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
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
      providesTags: ["Drafts"],
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
        const patchDrafts = dispatch(
          postApi.util.updateQueryData("getDrafts", undefined, (draft: any) => {
            if (!draft) return;
            const idx = draft.findIndex((p: any) => p.id === id);
            if (idx >= 0) draft.splice(idx, 1);
          }),
        );
        try {
          const { data: res } = await queryFulfilled;
          const publishedPost = (res as any)?.data;
          if (publishedPost) {
            dispatch(
              postApi.util.updateQueryData("getFeed", { cursor: undefined }, (draft: any) => {
                if (draft?.data?.posts) {
                  draft.data.posts.unshift(publishedPost);
                }
              }),
            );
          }
        } catch {
          patchDrafts.undo();
          soundManager.playError();
        }
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
