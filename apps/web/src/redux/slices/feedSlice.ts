"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Post, ReactionType } from "@/types/post";

export interface FeedState {
  allPosts: Post[];
  cursor: string | undefined;
  hasMore: boolean;
}

const initialState: FeedState = {
  allPosts: [],
  cursor: undefined,
  hasMore: false,
};

const feedSlice = createSlice({
  name: "feed",
  initialState,
  reducers: {
    setPage(
      state,
      action: PayloadAction<{
        posts: Post[];
        cursor: string | undefined;
        hasMore: boolean;
      }>,
    ) {
      state.allPosts = action.payload.posts;
      state.hasMore = action.payload.hasMore;
    },

    mergePage(
      state,
      action: PayloadAction<{
        posts: Post[];
        cursor: string | undefined;
        hasMore: boolean;
        append: boolean;
      }>,
    ) {
      const { posts, hasMore, append } = action.payload;
      state.hasMore = hasMore;
      if (append) {
        const map = new Map(state.allPosts.map((p) => [p.id, p]));
        for (const post of posts) {
          if (post.id) map.set(post.id, post);
        }
        state.allPosts = Array.from(map.values());
      } else {
        state.allPosts = posts;
      }
    },

    updateReaction(
      state,
      action: PayloadAction<{
        postId: string;
        userId: string;
        type: ReactionType;
      }>,
    ) {
      const { postId, userId, type } = action.payload;
      const post = state.allPosts.find((p) => p.id === postId);
      if (!post) return;
      const existing = post.reactions?.findIndex((r) => r.userId === userId);
      if (existing !== undefined && existing >= 0 && post.reactions) {
        if (post.reactions[existing].type === type) {
          post.reactions.splice(existing, 1);
          if (post._count?.reactions !== undefined) post._count.reactions -= 1;
        } else {
          post.reactions[existing].type = type;
        }
      } else {
        if (!post.reactions) post.reactions = [];
        post.reactions.push({ userId, type });
        if (post._count?.reactions !== undefined) post._count.reactions += 1;
      }
    },

    setCursor(state, action: PayloadAction<string | undefined>) {
      state.cursor = action.payload;
    },

    reset() {
      return initialState;
    },
  },
});

export const { setPage, mergePage, updateReaction, setCursor, reset } = feedSlice.actions;
export default feedSlice.reducer;
