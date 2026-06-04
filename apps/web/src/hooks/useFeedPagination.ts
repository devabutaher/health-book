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
      const deduped = action.append
        ? action.posts.filter(
            (p) =>
              !(state.allPosts as { id?: string }[]).find(
                (existing) => existing.id === (p as { id?: string }).id,
              ),
          )
        : action.posts;
      return {
        cursor: action.cursor,
        allPosts: action.append ? [...state.allPosts, ...deduped] : deduped,
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
