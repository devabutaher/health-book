"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/hooks";
import { useFollowMutation, useUnfollowMutation } from "@/redux/api/userApi";
import { useSound } from "@/hooks/useSound";
import { toast } from "sonner";

interface UseFollowOptions {
  /** Called synchronously before the mutation for optimistic updates */
  onOptimistic?: (following: boolean) => void;
  /** Called when the mutation fails — receives the previous following state */
  onError?: (previous: boolean) => void;
  /** Suppress sound effects */
  silent?: boolean;
  /** Custom error message prefix */
  errorLabel?: string;
}

/**
 * Unified follow/unfollow hook.
 *
 * Manages optimistic local state, fires the correct mutation, plays sounds,
 * and shows error toasts. Works identically across all components.
 *
 * The hook syncs its internal state with `initialFollowing` when not mid-mutation,
 * so external changes (e.g. RTK cache patches) are reflected automatically.
 *
 * @example
 * ```tsx
 * const { isFollowing, toggleFollow } = useFollow(user.id, user.isFollowing)
 * <button onClick={toggleFollow}>{isFollowing ? "Following" : "Follow"}</button>
 * ```
 */
export function useFollow(
  targetUserId: string | undefined | null,
  initialFollowing = false,
  options?: UseFollowOptions,
) {
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isPending, setIsPending] = useState(false);
  const isPendingRef = useRef(false);
  const [follow] = useFollowMutation();
  const [unfollow] = useUnfollowMutation();
  const { play } = useSound();

  // Keep ref in sync so it can be read inside callbacks without stale closures
  useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

  // Sync with external prop when not mid-mutation (e.g. RTK cache patches)
  useEffect(() => {
    if (!isPendingRef.current) {
      setIsFollowing(initialFollowing);
    }
  }, [initialFollowing]);

  const canFollow = !!targetUserId && !!currentUserId && currentUserId !== targetUserId;
  const label = options?.errorLabel ?? "update follow status";

  /** Toggle between follow and unfollow */
  const toggleFollow = useCallback(async () => {
    if (!canFollow) return;
    // Read isFollowing from a ref to avoid stale-closure issues with the guard
    const prev = isFollowing;
    setIsFollowing(!prev);
    setIsPending(true);
    isPendingRef.current = true;
    options?.onOptimistic?.(!prev);

    try {
      if (prev) {
        await unfollow(targetUserId!).unwrap();
      } else {
        await follow(targetUserId!).unwrap();
      }
      if (!options?.silent) play("reaction");
    } catch {
      setIsFollowing(prev);
      toast.error(`Failed to ${label}`);
      if (!options?.silent) play("error");
      options?.onError?.(prev);
    } finally {
      setIsPending(false);
      isPendingRef.current = false;
    }
  }, [canFollow, isFollowing, targetUserId, follow, unfollow, play, options, label]);

  /** Follow (no-op if already following) */
  const followUser = useCallback(async () => {
    if (!canFollow) return;
    const wasFollowing = isFollowing;
    if (wasFollowing || isPendingRef.current) return;
    setIsFollowing(true);
    setIsPending(true);
    isPendingRef.current = true;
    options?.onOptimistic?.(true);

    try {
      await follow(targetUserId!).unwrap();
      if (!options?.silent) play("reaction");
    } catch {
      setIsFollowing(false);
      toast.error(`Failed to ${label}`);
      if (!options?.silent) play("error");
      options?.onError?.(false);
    } finally {
      setIsPending(false);
      isPendingRef.current = false;
    }
  }, [canFollow, isFollowing, targetUserId, follow, play, options, label]);

  /** Unfollow (no-op if not following) */
  const unfollowUser = useCallback(async () => {
    if (!canFollow) return;
    const wasFollowing = isFollowing;
    if (!wasFollowing || isPendingRef.current) return;
    setIsFollowing(false);
    setIsPending(true);
    isPendingRef.current = true;
    options?.onOptimistic?.(false);

    try {
      await unfollow(targetUserId!).unwrap();
      if (!options?.silent) play("reaction");
    } catch {
      setIsFollowing(true);
      toast.error(`Failed to ${label}`);
      if (!options?.silent) play("error");
      options?.onError?.(true);
    } finally {
      setIsPending(false);
      isPendingRef.current = false;
    }
  }, [canFollow, isFollowing, targetUserId, unfollow, play, options, label]);

  return {
    /** Current follow state */
    isFollowing,
    /** True while a mutation is in flight */
    isPending,
    /** Toggle follow/unfollow */
    toggleFollow,
    /** Follow only (safe to call when already following) */
    follow: followUser,
    /** Unfollow only (safe to call when not following) */
    unfollow: unfollowUser,
    /** Manually override local state */
    setFollowing: setIsFollowing,
  };
}

/**
 * Bare follow/unfollow mutation helpers without state management.
 *
 * Use in components that manage follow state externally (e.g. ReelsFeed with
 * per-reel arrays, SuggestedSection with Set-based tracking).
 */
export function useFollowActions() {
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const [follow] = useFollowMutation();
  const [unfollow] = useUnfollowMutation();
  const { play } = useSound();

  const doFollow = useCallback(
    async (targetUserId: string) => {
      if (currentUserId === targetUserId) return;
      return follow(targetUserId).unwrap();
    },
    [currentUserId, follow],
  );

  const doUnfollow = useCallback(
    async (targetUserId: string) => {
      if (currentUserId === targetUserId) return;
      return unfollow(targetUserId).unwrap();
    },
    [currentUserId, unfollow],
  );

  return {
    /** Follow a user */
    follow: doFollow,
    /** Unfollow a user */
    unfollow: doUnfollow,
    /** Current user ID (for guards) */
    currentUserId,
    /** Play the reaction sound */
    play,
  };
}
