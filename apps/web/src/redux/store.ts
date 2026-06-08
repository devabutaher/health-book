import { combineReducers, configureStore, type Middleware } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "./storage";
import { authApi } from "./api/authApi";
import { challengesApi } from "./api/challengesApi";
import { commentApi } from "./api/commentApi";
import { groupsApi } from "./api/groupsApi";
import { groupEventApi } from "./api/groupEventApi";
import { groupPollApi } from "./api/groupPollApi";
import { healthLogApi } from "./api/healthLogApi";
import { highlightsApi } from "./api/highlightsApi";
import { messagingApi } from "./api/messagingApi";
import { notificationApi } from "./api/notificationApi";
import { periodLogApi } from "./api/periodLogApi";
import { postApi } from "./api/postApi";
import { reelsApi } from "./api/reelsApi";
import { searchApi } from "./api/searchApi";
import { storiesApi } from "./api/storiesApi";
import { userApi } from "./api/userApi";
import { weightLogApi } from "./api/weightLogApi";
import { newsApi } from "./api/newsApi";
import { pushApi } from "./api/pushApi";
import authReducer from "./slices/authSlice";
import settingsReducer, { type SettingsState } from "./slices/settingsSlice";

const SETTINGS_STORAGE_KEY = "hb-settings";

const persistSettingsMiddleware: Middleware = (store) => {
  let lastSerialized = "";
  return (next) => (action) => {
    const result = next(action);
    if (typeof window === "undefined") return result;
    const settings = (store.getState() as { settings: SettingsState }).settings;
    const serialized = JSON.stringify(settings);
    if (serialized !== lastSerialized) {
      lastSerialized = serialized;
      try {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, serialized);
      } catch {
        /* quota or private mode */
      }
    }
    return result;
  };
};

const rootReducer = combineReducers({
  auth: authReducer,
  settings: settingsReducer,
  [authApi.reducerPath]: authApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [postApi.reducerPath]: postApi.reducer,
  [commentApi.reducerPath]: commentApi.reducer,
  [healthLogApi.reducerPath]: healthLogApi.reducer,
  [searchApi.reducerPath]: searchApi.reducer,
  [notificationApi.reducerPath]: notificationApi.reducer,
  [periodLogApi.reducerPath]: periodLogApi.reducer,
  [weightLogApi.reducerPath]: weightLogApi.reducer,
  [messagingApi.reducerPath]: messagingApi.reducer,
  [groupsApi.reducerPath]: groupsApi.reducer,
  [challengesApi.reducerPath]: challengesApi.reducer,
  [groupEventApi.reducerPath]: groupEventApi.reducer,
  [groupPollApi.reducerPath]: groupPollApi.reducer,
  [storiesApi.reducerPath]: storiesApi.reducer,
  [reelsApi.reducerPath]: reelsApi.reducer,
  [highlightsApi.reducerPath]: highlightsApi.reducer,
  [newsApi.reducerPath]: newsApi.reducer,
  [pushApi.reducerPath]: pushApi.reducer,
});

const persistConfig = {
  key: "hb-root",
  storage,
  blacklist: ["auth", "settings"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      persistSettingsMiddleware,
      authApi.middleware,
      userApi.middleware,
      postApi.middleware,
      commentApi.middleware,
      healthLogApi.middleware,
      searchApi.middleware,
      notificationApi.middleware,
      periodLogApi.middleware,
      weightLogApi.middleware,
      messagingApi.middleware,
      groupsApi.middleware,
      challengesApi.middleware,
      groupEventApi.middleware,
      groupPollApi.middleware,
      storiesApi.middleware,
      reelsApi.middleware,
      highlightsApi.middleware,
      newsApi.middleware,
      pushApi.middleware,
    ),
});

export const persistor = persistStore(store);

setupListeners(store.dispatch, (dispatch, { onFocus, onOnline, onOffline }) => {
  if (typeof window === "undefined") return () => {};
  // Only handle online/offline, skip refetchOnFocus
  const handleOnline = () => dispatch(onOnline());
  const handleOffline = () => dispatch(onOffline());
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const resetApiCache = () => {
  const apis = [
    authApi,
    userApi,
    postApi,
    commentApi,
    healthLogApi,
    searchApi,
    notificationApi,
    periodLogApi,
    weightLogApi,
    messagingApi,
    groupsApi,
    challengesApi,
    groupEventApi,
    groupPollApi,
    storiesApi,
    reelsApi,
    highlightsApi,
    newsApi,
  ];
  apis.forEach((api) => store.dispatch(api.util.resetApiState()));
};
