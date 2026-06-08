import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  coverPhoto: string | null;
  gender: string | null;
  role: "USER" | "ADMIN" | "MODERATOR";
  isVerified: boolean;
  isPrivate: boolean;
  createdAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const STORAGE_KEY = "hb_auth";

function saveToStorage(accessToken: string | null, refreshToken: string | null) {
  try {
    if (accessToken && refreshToken) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken, refreshToken }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* browser-only or quota — ignore */
  }
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string; refreshToken?: string }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken || null;
      state.isAuthenticated = true;
      state.isLoading = false;
      saveToStorage(action.payload.accessToken, action.payload.refreshToken || null);
    },
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isLoading = true;
      saveToStorage(action.payload.accessToken, action.payload.refreshToken);
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setRefreshToken: (state, action: PayloadAction<string>) => {
      state.refreshToken = action.payload;
      const existing = state.accessToken;
      saveToStorage(existing, action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      saveToStorage(null, null);
    },
  },
});

export const { setCredentials, setTokens, setUser, setLoading, setRefreshToken, logout } =
  authSlice.actions;
export default authSlice.reducer;
