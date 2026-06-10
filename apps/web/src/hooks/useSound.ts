"use client";

import { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

export type SoundKey =
  | "post-publish"
  | "reaction"
  | "message-send"
  | "message-receive"
  | "streak-milestone"
  | "badge-earned"
  | "follow"
  | "error"
  | "success";

const SOUNDS: Record<SoundKey, { src: string; volume: number }> = {
  "post-publish": { src: "/sounds/post-publish.mp3", volume: 0.4 },
  reaction: { src: "/sounds/reaction.mp3", volume: 0.3 },
  "message-send": { src: "/sounds/message-send.mp3", volume: 0.3 },
  "message-receive": { src: "/sounds/message-receive.mp3", volume: 0.35 },
  "streak-milestone": { src: "/sounds/streak-milestone.mp3", volume: 0.5 },
  "badge-earned": { src: "/sounds/badge-earned.mp3", volume: 0.5 },
  follow: { src: "/sounds/follow.mp3", volume: 0.3 },
  error: { src: "/sounds/error.mp3", volume: 0.25 },
  success: { src: "/sounds/success.mp3", volume: 0.3 },
};

// Module-level singleton Audio pool — shared across all component instances
// Prevents creating 9 Audio() per component (44+ instances × 9 = 396+ Audio objects)
let initialised = false;
const audioPool = new Map<string, HTMLAudioElement>();

function ensurePool() {
  if (initialised) return;
  initialised = true;
  Object.entries(SOUNDS).forEach(([key, config]) => {
    const audio = new Audio(config.src);
    audio.volume = config.volume;
    audio.preload = "auto";
    audioPool.set(key, audio);
  });
}

export function useSound() {
  const soundEnabled = useSelector(
    (s: RootState) =>
      (s as { settings?: { soundEnabled?: boolean } }).settings?.soundEnabled ?? true,
  );

  // Ensure pool is initialised once — useEffect guarantees render-phase safety.
  useEffect(() => {
    ensurePool();
  }, []);

  const play = useCallback(
    (key: SoundKey) => {
      if (!soundEnabled) return;
      if (typeof window === "undefined") return;
      try {
        let audio = audioPool.get(key);
        if (!audio) {
          audio = new Audio(SOUNDS[key].src);
          audio.volume = SOUNDS[key].volume;
          audio.preload = "auto";
          audioPool.set(key, audio);
        }
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } catch {
        // never crash on sound failure
      }
    },
    [soundEnabled],
  );

  const playOptimistic = useCallback(
    (key: SoundKey) => {
      play(key);
      return {
        onError: () => {
          play("error");
        },
      };
    },
    [play],
  );

  return { play, playOptimistic };
}
