"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { useAppSelector } from "@/hooks";
import {
  useSubscribePushMutation,
  useUnsubscribePushMutation,
  useGetVapidPublicKeyQuery,
} from "@/redux/api/pushApi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const dismissedUntil = useRef(() => {
    try {
      return parseInt(localStorage.getItem("pwa-install-dismissed-at") ?? "", 10) || 0;
    } catch {
      return 0;
    }
  }).current();
  const user = useAppSelector((s) => s.auth.user);
  const [subscribe] = useSubscribePushMutation();
  const [unsubscribe] = useUnsubscribePushMutation();
  const { data: vapidData } = useGetVapidPublicKeyQuery(undefined, { skip: !user });

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Capture install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (Date.now() - dismissedUntil > 86400000) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Subscribe to push when user logs in
  useEffect(() => {
    if (!user || !vapidData?.publicKey) return;

    let cancelled = false;

    const setupPush = async () => {
      if (!("Notification" in window) || !("PushManager" in window)) return;

      const permission = await Notification.requestPermission();
      if (permission !== "granted" || cancelled) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          // Already subscribed, keep existing
          return;
        }

        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            vapidData.publicKey,
          ) as unknown as BufferSource,
        });

        const p256dh = sub.getKey("p256dh");
        const auth = sub.getKey("auth");
        if (!p256dh || !auth) return;

        await subscribe({
          endpoint: sub.endpoint,
          p256dh: arrayBufferToBase64(p256dh),
          auth: arrayBufferToBase64(auth),
        }).unwrap();
      } catch {
        // Permission denied or push not supported
      }
    };

    setupPush();

    return () => {
      cancelled = true;
    };
  }, [user, vapidData, subscribe]);

  // Unsubscribe on logout
  useEffect(() => {
    if (user) return;

    const cleanup = async () => {
      if (!("serviceWorker" in navigator)) return;
      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          await unsubscribe({ endpoint: existing.endpoint }).unwrap();
          await existing.unsubscribe();
        }
      } catch {
        // ignore
      }
    };

    cleanup();
  }, [user, unsubscribe]);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;
    const promptEvent = installPrompt as Event & {
      prompt: () => void;
      userChoice: Promise<{ outcome: string }>;
    };
    promptEvent.prompt();
    const result = await promptEvent.userChoice;
    if (result.outcome === "accepted") {
      setShowInstallBanner(false);
    }
  }, [installPrompt]);

  const handleDismiss = useCallback(() => {
    setShowInstallBanner(false);
    setDismissed(true);
    try {
      localStorage.setItem("pwa-install-dismissed-at", String(Date.now()));
    } catch {}
  }, []);

  return (
    <>
      {children}
      {showInstallBanner && !dismissed && (
        <div
          className={cn(
            "fixed bottom-20 left-3 right-3 z-50",
            "rounded-2xl border border-[var(--glass-border)]",
            "bg-[var(--popover)]/95 backdrop-blur-2xl",
            "p-4 shadow-lg",
            "md:bottom-6 md:left-auto md:right-4 md:w-80",
          )}
        >
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-[var(--bg-overlay)] hover:text-foreground"
          >
            <X className="size-4" />
          </button>
          <p className="mb-3 pr-6 text-sm font-medium">
            Install HealthBook for a better mobile experience and faster loading.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleDismiss} variant="ghost" size="sm" className="flex-1">
              Not now
            </Button>
            <Button onClick={handleInstall} size="sm" className="flex-1">
              Install
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
