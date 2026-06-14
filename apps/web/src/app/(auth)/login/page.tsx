"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, Sparkles, LogIn } from "lucide-react";
import { useLoginMutation } from "@/redux/api/authApi";
import { setCredentials } from "@/redux/slices/authSlice";
import { useAppDispatch } from "@/hooks";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { GlassCard } from "@/components/ui/glass-card";
import { Spinner } from "@/components/ui/spinner";
import { PasswordField } from "@/components/shared/PasswordField";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  // Clear stale auth on mount to prevent unnecessary API call
  useEffect(() => {
    try {
      const stored = localStorage.getItem("hb_auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.accessToken) localStorage.removeItem("hb_auth");
      }
    } catch {}
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [oauthLoading, setOauthLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const result = await login({
        email: "demo@healthbook.app",
        password: "Demo123!",
      }).unwrap();
      dispatch(
        setCredentials({
          user: result.data.user,
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        }),
      );
      const cookieBase = `path=/; maxAge=604800; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      document.cookie = `hb_token=${result.data.accessToken}; ${cookieBase}`;
      document.cookie = `hb_rt=${result.data.refreshToken}; ${cookieBase}`;
      new Audio("/sounds/badge-earned.mp3").play().catch(() => {});
      const { postApi } = await import("@/redux/api/postApi");
      const { userApi } = await import("@/redux/api/userApi");
      dispatch(postApi.util.prefetch("getFeed", { cursor: undefined }, { force: true }));
      dispatch(userApi.util.prefetch("getSuggested", undefined, { force: true }));
      router.push("/feed");
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || "Demo login failed";
      toast.error(msg);
      setDemoLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter email and password");
      return;
    }
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(
        setCredentials({
          user: result.data.user,
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        }),
      );
      const cookieBase = `path=/; maxAge=604800; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      document.cookie = `hb_token=${result.data.accessToken}; ${cookieBase}`;
      document.cookie = `hb_rt=${result.data.refreshToken}; ${cookieBase}`;
      new Audio("/sounds/badge-earned.mp3").play().catch(() => {});
      const { postApi } = await import("@/redux/api/postApi");
      const { userApi } = await import("@/redux/api/userApi");
      dispatch(postApi.util.prefetch("getFeed", { cursor: undefined }, { force: true }));
      dispatch(userApi.util.prefetch("getSuggested", undefined, { force: true }));
      router.push("/feed");
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || "Login failed";
      toast.error(msg);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute inset-0 bg-mesh-1 opacity-50" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <GlassCard variant="noise" className="p-8">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-teal to-brand-green shadow-[var(--shadow-glow-teal)]">
              <Sparkles className="size-6 text-white" />
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to continue your health journey</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="email" className="text-sm font-medium">
                  Email
                </FieldLabel>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password" className="text-sm font-medium">
                    Password
                  </FieldLabel>
                  <Link
                    href="/forgot-password"
                    prefetch={false}
                    className="text-xs font-medium text-brand-teal hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <PasswordField
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              disabled={isLoading}
              className="w-full font-display"
            >
              {isLoading ? <Spinner /> : <ArrowRight />}
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-default)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--card-bg)] px-2 text-muted-foreground">
                or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleGoogleLogin}
            disabled={oauthLoading}
            className="w-full font-display"
          >
            {oauthLoading ? (
              <Spinner />
            ) : (
              <svg className="mr-2 size-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {oauthLoading ? "Connecting..." : "Sign in with Google"}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-default)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--card-bg)] px-2 text-muted-foreground">
                or try the app
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleDemoLogin}
            disabled={demoLoading}
            className="w-full border-brand-teal/40 font-display text-brand-teal hover:bg-brand-teal/10"
          >
            {demoLoading ? <Spinner /> : <LogIn className="mr-2 size-4" />}
            {demoLoading ? "Logging in..." : "Try Demo Account"}
          </Button>

          <FieldDescription className="pt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              prefetch={false}
              className="font-semibold text-brand-teal hover:underline"
            >
              Create one
            </Link>
          </FieldDescription>
        </GlassCard>
      </motion.div>
    </div>
  );
}
