/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import type { RootState } from "../store";
import type { Comment } from "@/types/comment";
import { soundManager } from "@/lib/soundManager";

export const commentApi = createApi({
  reducerPath: "commentApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/comments`),
  tagTypes: ["Post", "Comments", "Feed"],
  endpoints: (builder) => ({
    getComments: builder.query({
      query: ({ postId, cursor }: { postId: string; cursor?: string }) =>
        `/${postId}${cursor ? `?cursor=${cursor}` : ""}`,
      providesTags: (_result, _error, { postId }) => [{ type: "Comments", id: postId }],
    }),
    createComment: builder.mutation({
      query: ({
        postId,
        content,
        parentId,
      }: {
        postId: string;
        content: string;
        parentId?: string;
      }) => ({
        url: `/${postId}`,
        method: "POST",
        body: { content, parentId },
      }),
      invalidatesTags: (_result, _error, { postId }) => [
        { type: "Post", id: postId },
        { type: "Comments", id: postId },
        "Feed",
      ],
      onQueryStarted: async (
        { postId, content, parentId },
        { dispatch, getState, queryFulfilled },
      ) => {
        const user = (getState() as RootState).auth.user;
        if (!user) return;
        const tempId = `temp-${Date.now()}`;
        const patch = dispatch(
          commentApi.util.updateQueryData("getComments", { postId }, (draft) => {
            const optimistic: Comment = {
              id: tempId,
              postId,
              userId: user.id,
              content,
              parentId: parentId || null,
              isPinned: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              user: {
                id: user.id,
                name: user.name,
                username: user.username,
                avatar: user.avatar,
                isVerified: false,
              },
            };
            if (!draft.data) draft.data = { comments: [] };
            draft.data.comments.unshift(optimistic);
          }),
        );
        try {
          const result = await queryFulfilled;
          const body = result.data as { success?: boolean; data?: Comment } | undefined;
          if (body?.data?.id) {
            dispatch(
              commentApi.util.updateQueryData("getComments", { postId }, (draft) => {
                const idx = draft.data.comments.findIndex((c: Comment) => c.id === tempId);
                if (idx >= 0) draft.data.comments[idx].id = body.data!.id;
              }),
            );
          }
        } catch {
          patch.undo();
          soundManager.playError();
        }
      },
    }),
    updateComment: builder.mutation({
      query: ({ commentId, content }: { commentId: string; content: string }) => ({
        url: `/${commentId}`,
        method: "PUT",
        body: { content },
      }),
      invalidatesTags: ["Comments", "Feed"],
      onQueryStarted: async ({ commentId, content }, { dispatch, queryFulfilled, getState }) => {
        const state = getState() as RootState;
        const queries = (state as any).commentApi?.queries ?? {};
        let patch: { undo: () => void } | undefined;
        for (const key of Object.keys(queries)) {
          const entry = queries[key];
          if (entry?.data?.data?.comments?.some((c: any) => c.id === commentId)) {
            try {
              patch = dispatch(
                commentApi.util.updateQueryData("getComments", entry.arg, (draft: any) => {
                  if (!draft?.data?.comments) return;
                  const idx = draft.data.comments.findIndex((c: any) => c.id === commentId);
                  if (idx >= 0) draft.data.comments[idx].content = content;
                }),
              );
            } catch {}
            break;
          }
        }
        try {
          await queryFulfilled;
        } catch {
          patch?.undo();
          soundManager.playError();
        }
      },
    }),
    deleteComment: builder.mutation({
      query: (commentId: string) => ({
        url: `/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Comments", "Feed"],
      onQueryStarted: async (commentId, { dispatch, queryFulfilled, getState }) => {
        const state = getState() as RootState;
        const queries = (state as any).commentApi?.queries ?? {};
        let patch: { undo: () => void } | undefined;
        for (const key of Object.keys(queries)) {
          const entry = queries[key];
          if (entry?.data?.data?.comments?.some((c: any) => c.id === commentId)) {
            try {
              patch = dispatch(
                commentApi.util.updateQueryData("getComments", entry.arg, (draft: any) => {
                  if (!draft?.data?.comments) return;
                  draft.data.comments = draft.data.comments.filter((c: any) => c.id !== commentId);
                }),
              );
            } catch {}
            break;
          }
        }
        try {
          await queryFulfilled;
        } catch {
          patch?.undo();
          soundManager.playError();
        }
      },
    }),
    togglePin: builder.mutation({
      query: (commentId: string) => ({
        url: `/${commentId}/pin`,
        method: "POST",
      }),
      invalidatesTags: ["Comments"],
      onQueryStarted: async (commentId, { dispatch, queryFulfilled, getState }) => {
        const state = getState() as RootState;
        const queries = (state as any).commentApi?.queries ?? {};
        let patch: { undo: () => void } | undefined;
        for (const key of Object.keys(queries)) {
          const entry = queries[key];
          if (entry?.data?.data?.comments?.some((c: any) => c.id === commentId)) {
            try {
              patch = dispatch(
                commentApi.util.updateQueryData("getComments", entry.arg, (draft: any) => {
                  if (!draft?.data?.comments) return;
                  const idx = draft.data.comments.findIndex((c: any) => c.id === commentId);
                  if (idx >= 0)
                    draft.data.comments[idx].isPinned = !draft.data.comments[idx].isPinned;
                }),
              );
            } catch {}
            break;
          }
        }
        try {
          await queryFulfilled;
        } catch {
          patch?.undo();
        }
      },
    }),
  }),
});

export const {
  useGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useTogglePinMutation,
} = commentApi;
