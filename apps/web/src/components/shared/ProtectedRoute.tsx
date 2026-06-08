"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAppSelector } from "@/hooks";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  useEffect(() => {
    if (!isLoading && !accessToken) {
      const redirect = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
      try {
        router.replace(`/login${redirect}`);
      } catch {
        window.location.href = `/login${redirect}`;
      }
    }
  }, [accessToken, isLoading, router, pathname]);

  if (isLoading) return null;
  if (!accessToken) return null;

  return <>{children}</>;
}
