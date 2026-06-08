"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { useGetMeQuery } from "@/redux/api/authApi";
import { setTokens, setCredentials, setLoading, logout } from "@/redux/slices/authSlice";
import { supabase } from "@/lib/supabase";
import { usePresenceRealtime } from "@/hooks/usePresenceRealtime";
import { setRealtimeStatus } from "@/lib/realtimeConnectionStore";

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
  const { data, isError, error, refetch } = useGetMeQuery(undefined, { skip: !accessToken });
  const initRef = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

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

    setAuthCookie(null);
    clearCookie("hb_rt");
    dispatch(setLoading(false));
  }, [dispatch]);

  // Capture refetch in a ref to stabilize the effect dependency
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    // Guard: don't stack retry timers
    if (retryTimer.current) return;

    if (data && data.data) {
      clearTimeout(retryTimer.current);
      retryCount.current = 0;
      dispatch(
        setCredentials({
          user: data.data,
          accessToken: accessToken!,
          refreshToken: refreshToken!,
        }),
      );
    } else if (isError) {
      const isAuthError = error && "status" in error && error.status === 401;
      if (isAuthError && !refreshToken) {
        clearTimeout(retryTimer.current);
        dispatch(setLoading(false));
        dispatch(logout());
      } else if (retryCount.current < MAX_RETRIES) {
        retryCount.current += 1;
        const delay = retryCount.current === 1 ? 3000 : 5000;
        retryTimer.current = setTimeout(() => refetchRef.current(), delay);
      } else {
        clearTimeout(retryTimer.current);
        dispatch(setLoading(false));
      }
    }
    return () => clearTimeout(retryTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isError, error, dispatch]);

  useEffect(() => {
    if (accessToken) {
      supabase.realtime.setAuth(accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    const channel = supabase.channel("hb-system");
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") setRealtimeStatus("connected");
      else if (status === "CHANNEL_ERROR") setRealtimeStatus("error");
      else if (status === "TIMED_OUT") setRealtimeStatus("disconnected");
    });
    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      setRealtimeStatus("disconnected");
    };
  }, [accessToken]);

  useEffect(() => {
    const proto = location.protocol === "https:" ? "; Secure" : "";
    const base = `path=/; maxAge=604800; SameSite=Lax${proto}`;
    if (accessToken) {
      setAuthCookie(accessToken);
      document.cookie = `hb_rt=${refreshToken}; ${base}`;
    } else {
      setAuthCookie(null);
      document.cookie = "hb_rt=; path=/; maxAge=0; SameSite=Lax";
    }
  }, [accessToken, refreshToken]);

  return <>{children}</>;
}
