"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { useGetMeQuery } from "@/redux/api/authApi";
import { setUser, setLoading, logout } from "@/redux/slices/authSlice";
import { supabase } from "@/lib/supabase";
import { usePresenceRealtime } from "@/hooks/usePresenceRealtime";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const { data, isLoading, isError } = useGetMeQuery(undefined);

  usePresenceRealtime();

  useEffect(() => {
    if (data && data.data) {
      dispatch(setUser(data.data));
    } else if (isError) {
      dispatch(logout());
    } else if (!isLoading) {
      dispatch(setLoading(false));
    }
  }, [data, isLoading, isError, dispatch]);

  useEffect(() => {
    if (accessToken) {
      supabase.realtime.setAuth(accessToken);
    }
  }, [accessToken]);

  return <>{children}</>;
}
