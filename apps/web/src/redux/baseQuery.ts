import { fetchBaseQuery, type BaseQueryFn, type BaseQueryApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "./store";
import type { FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { logout, setCredentials, type AuthUser } from "./slices/authSlice";
import { toast } from "sonner";

interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  };
}

const refreshBaseQuery = fetchBaseQuery({
  baseUrl: `${process.env["NEXT_PUBLIC_API_URL"]}/api/auth`,
  credentials: "include",
});

let pendingRefresh: Promise<boolean> | null = null;

async function attemptRefresh(
  api: BaseQueryApi,
  extraOptions: Record<string, unknown>,
): Promise<boolean> {
  const refreshToken = (api.getState() as RootState).auth.refreshToken;
  if (!refreshToken) return false;

  const refreshResult = await refreshBaseQuery(
    { url: "/refresh", method: "POST", body: { refreshToken } },
    api,
    extraOptions,
  );

  if (refreshResult.data) {
    const data = refreshResult.data as RefreshResponse;
    api.dispatch(
      setCredentials({
        user: data.data.user,
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      }),
    );
    return true;
  }
  return false;
}

function acquireRefreshLock(
  api: BaseQueryApi,
  extraOptions: Record<string, unknown>,
): Promise<boolean> {
  if (!pendingRefresh) {
    pendingRefresh = (async () => {
      try {
        return await attemptRefresh(api, extraOptions);
      } catch {
        return false;
      } finally {
        pendingRefresh = null;
      }
    })();
  }
  return pendingRefresh;
}

export function createBaseQuery(baseUrl: string) {
  const apiBaseQuery = fetchBaseQuery({
    baseUrl,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  });

  const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions,
  ) => {
    let result = await apiBaseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
      const state = api.getState() as RootState;
      if (!state.auth.refreshToken) {
        return result;
      }

      const refreshed = await acquireRefreshLock(api, extraOptions);

      if (refreshed) {
        result = await apiBaseQuery(args, api, extraOptions);
      } else {
        if (typeof window !== "undefined" && !window.location.href.includes("/login")) {
          toast.error("Session expired. Please login again.");
        }
        api.dispatch(logout());
      }
    }

    return result;
  };

  return baseQueryWithReauth;
}
