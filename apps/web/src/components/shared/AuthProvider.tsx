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
    const raw = sessionStorage.getItem("hb_auth");
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);
  const { data, isError } = useGetMeQuery(undefined, { skip: !accessToken });
  const initRef = useRef(false);

  usePresenceRealtime();

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const oauthAt = getCookie("hb_at");
    const oauthRt = getCookie("hb_rt");

    if (oauthAt && oauthRt) {
      clearCookie("hb_at");
      clearCookie("hb_rt");
      dispatch(setTokens({ accessToken: oauthAt, refreshToken: oauthRt }));
      return;
    }

    const stored = loadTokensFromStorage();
    if (stored.accessToken && stored.refreshToken) {
      dispatch(setTokens({ accessToken: stored.accessToken, refreshToken: stored.refreshToken }));
      return;
    }

    dispatch(setLoading(false));
  }, [dispatch]);

  useEffect(() => {
    if (data && data.data) {
      dispatch(setCredentials({
        user: data.data,
        accessToken: accessToken!,
        refreshToken: refreshToken!,
      }));
    } else if (isError) {
      dispatch(logout());
    }
  }, [data, isError, dispatch, accessToken, refreshToken]);

  useEffect(() => {
    if (accessToken) {
      supabase.realtime.setAuth(accessToken);
    }
  }, [accessToken]);

  return <>{children}</>;
}
