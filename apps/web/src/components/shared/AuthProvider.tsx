"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { useGetMeQuery } from "@/redux/api/authApi";
import { setTokens, setCredentials, setLoading, logout } from "@/redux/slices/authSlice";
import { supabase } from "@/lib/supabase";
import { usePresenceRealtime } from "@/hooks/usePresenceRealtime";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; Secure; SameSite=Lax`;
}

function loadTokensFromStorage(): { accessToken: string | null; refreshToken: string | null } {
  try {
    const raw = localStorage.getItem("hb_auth");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        accessToken: parsed.accessToken || null,
        refreshToken: parsed.refreshToken || null,
      };
    }
  } catch {
    /* corrupt data — ignore */
  }
  return { accessToken: null, refreshToken: null };
}

function setAuthCookie(token: string | null) {
  if (token) {
    document.cookie = `hb_token=${token}; path=/; maxAge=604800; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  } else {
    document.cookie = "hb_token=; path=/; maxAge=0; SameSite=Lax";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data, isError, error, refetch } = useGetMeQuery(undefined, { skip: !accessToken });
  const initRef = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  usePresenceRealtime();

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const oauthAt = getCookie("hb_at");
    const oauthRt = getCookie("hb_rt");

    if (oauthAt && oauthRt) {
      clearCookie("hb_at");
      dispatch(setTokens({ accessToken: oauthAt, refreshToken: oauthRt }));
      return;
    }

    const stored = loadTokensFromStorage();
    if (stored.accessToken && stored.refreshToken) {
      dispatch(setTokens({ accessToken: stored.accessToken, refreshToken: stored.refreshToken }));
      return;
    }

    const cookieToken = getCookie("hb_token");
    const cookieRt = getCookie("hb_rt");
    if (cookieToken && cookieRt) {
      dispatch(setTokens({ accessToken: cookieToken, refreshToken: cookieRt }));
      return;
    }

    dispatch(setLoading(false));
  }, [dispatch]);

  useEffect(() => {
    if (data && data.data) {
      clearTimeout(retryTimer.current);
      dispatch(setCredentials({
        user: data.data,
        accessToken: accessToken!,
        refreshToken: refreshToken!,
      }));
    } else if (isError) {
      const isAuthError = error && "status" in error && error.status === 401;
      if (isAuthError && !refreshToken) {
        dispatch(logout());
      } else if (isAuthError) {
        dispatch(setLoading(false));
      } else {
        // Transient error (network, 5xx). Tokens are likely still valid.
        // Retry instead of redirecting to login.
        const stored = loadTokensFromStorage();
        if (stored.accessToken) {
          retryTimer.current = setTimeout(() => refetch(), 3000);
        } else {
          dispatch(setLoading(false));
        }
      }
    }
    return () => clearTimeout(retryTimer.current);
  }, [data, isError, error, dispatch, accessToken, refreshToken, refetch]);

  useEffect(() => {
    if (accessToken) {
      supabase.realtime.setAuth(accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    const proto = location.protocol === "https:" ? "; Secure" : "";
    const base = `path=/; maxAge=604800; SameSite=Lax${proto}`;
    if (isAuthenticated && accessToken) {
      setAuthCookie(accessToken);
      document.cookie = `hb_rt=${refreshToken}; ${base}`;
    } else if (!accessToken) {
      setAuthCookie(null);
      document.cookie = "hb_rt=; path=/; maxAge=0; SameSite=Lax";
    }
  }, [isAuthenticated, accessToken, refreshToken]);

  return <>{children}</>;
}
