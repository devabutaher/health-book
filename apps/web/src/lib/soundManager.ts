"use client";

const STORAGE_KEY = "hb-settings";

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

class SoundManager {
  private audioCache = new Map<string, HTMLAudioElement>();
  private _enabled = true;

  constructor() {
    this._enabled = this.loadEnabled();
    this.preload();
  }

  private loadEnabled(): boolean {
    if (typeof window === "undefined") return true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return true;
      const parsed = JSON.parse(raw);
      return parsed.soundEnabled !== false;
    } catch {
      return true;
    }
  }

  get enabled(): boolean {
    return this._enabled;
  }

  setEnabled(v: boolean) {
    this._enabled = v;
  }

  refreshEnabled() {
    this._enabled = this.loadEnabled();
  }

  private preload() {
    if (typeof window === "undefined") return;
    Object.entries(SOUNDS).forEach(([key, config]) => {
      if (!this.audioCache.has(key)) {
        const audio = new Audio(config.src);
        audio.volume = config.volume;
        audio.preload = "auto";
        this.audioCache.set(key, audio);
      }
    });
  }

  play(key: SoundKey) {
    if (!this._enabled) return;
    if (typeof window === "undefined") return;
    try {
      let audio = this.audioCache.get(key);
      if (!audio) {
        audio = new Audio(SOUNDS[key].src);
        audio.volume = SOUNDS[key].volume;
        audio.preload = "auto";
        this.audioCache.set(key, audio);
      }
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {
      /* never crash on sound failure */
    }
  }

  playError() {
    this.play("error");
  }

  playSuccess() {
    this.play("success");
  }
}

export const soundManager = new SoundManager();
