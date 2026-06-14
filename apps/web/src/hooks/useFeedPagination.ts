"use client";

import { useCallback, useReducer, useRef } from "react";

export interface FeedPage {
  posts: unknown[];
  nextCursor?: string;
  hasMore?: boolean;
}

interface State {
  cursor: string | undefined;
  allPosts: unknown[];
}

type Action =
  | { type: "set-cursor"; cursor: string | undefined }
  | { type: "merge-page"; posts: unknown[]; cursor: string | undefined; append: boolean }
  | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "set-cursor":
      return { ...state, cursor: action.cursor };
    case "merge-page": {
      // Only update cursor when a valid nextCursor is returned,
      // otherwise keep the existing cursor to avoid refetching page 1
      const nextCursor = action.cursor ?? state.cursor;
      if (action.append) {
        // Merge: update existing posts when they reappear (e.g. RTK cache patches)
        const map = new Map((state.allPosts as { id?: string }[]).map((p) => [p.id, p]));
        for (const post of action.posts as { id?: string }[]) {
          if (post.id) map.set(post.id, post);
        }
        return {
          cursor: nextCursor,
          allPosts: Array.from(map.values()),
        };
      }
      return {
        cursor: nextCursor,
        allPosts: action.posts,
      };
    }
    case "reset":
      return { cursor: undefined, allPosts: [] };
  }
}

export interface UseFeedPaginationResult<T> {
  cursor: string | undefined;
  allPosts: T[];
  loadMore: (next: string | undefined) => void;
  applyPage: (page: FeedPage | undefined, append: boolean) => void;
  reset: () => void;
}

export function useFeedPagination<T = unknown>(initial?: {
  cursor?: string;
  all?: T[];
}): UseFeedPaginationResult<T> {
  const [state, dispatch] = useReducer(reducer, {
    cursor: initial?.cursor,
    allPosts: (initial?.all ?? []) as unknown[],
  });
  const lastSeenCursor = useRef<string | undefined>(undefined);

  const loadMore = useCallback((next: string | undefined) => {
    if (lastSeenCursor.current === next) return;
    lastSeenCursor.current = next;
    dispatch({ type: "set-cursor", cursor: next });
  }, []);

  const applyPage = useCallback((page: FeedPage | undefined, append: boolean) => {
    if (!page) return;
    dispatch({
      type: "merge-page",
      posts: page.posts,
      cursor: page.nextCursor,
      append,
    });
  }, []);

  const reset = useCallback(() => {
    lastSeenCursor.current = undefined;
    dispatch({ type: "reset" });
  }, []);

  return {
    cursor: state.cursor,
    allPosts: state.allPosts as T[],
    loadMore,
    applyPage,
    reset,
  };
}
