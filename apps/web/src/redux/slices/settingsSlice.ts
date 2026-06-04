"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemePreference = "light" | "dark" | "system";

export interface SettingsState {
  soundEnabled: boolean;
  themePreference: ThemePreference;
  reducedMotion: boolean;
  autoplayVideos: boolean;
  compactMode: boolean;
}

const STORAGE_KEY = "hb-settings";

function loadInitial(): SettingsState {
  const fallback: SettingsState = {
    soundEnabled: true,
    themePreference: "system",
    reducedMotion: false,
    autoplayVideos: true,
    compactMode: false,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

const settingsSlice = createSlice({
  name: "settings",
  initialState: loadInitial(),
  reducers: {
    toggleSound(state) {
      state.soundEnabled = !state.soundEnabled;
    },
    setSoundEnabled(state, action: PayloadAction<boolean>) {
      state.soundEnabled = action.payload;
    },
    setThemePreference(state, action: PayloadAction<ThemePreference>) {
      state.themePreference = action.payload;
    },
    setReducedMotion(state, action: PayloadAction<boolean>) {
      state.reducedMotion = action.payload;
    },
    toggleAutoplay(state) {
      state.autoplayVideos = !state.autoplayVideos;
    },
    setAutoplayVideos(state, action: PayloadAction<boolean>) {
      state.autoplayVideos = action.payload;
    },
    toggleCompact(state) {
      state.compactMode = !state.compactMode;
    },
    setCompactMode(state, action: PayloadAction<boolean>) {
      state.compactMode = action.payload;
    },
    resetSettings() {
      return loadInitial();
    },
  },
});

export const {
  toggleSound,
  setSoundEnabled,
  setThemePreference,
  setReducedMotion,
  toggleAutoplay,
  setAutoplayVideos,
  toggleCompact,
  setCompactMode,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
