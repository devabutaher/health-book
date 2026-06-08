"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { GlassCard } from "@/components/ui/glass-card";
import { Spinner } from "@/components/ui/spinner";
import { PasswordField } from "@/components/shared/PasswordField";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const markReady = () => {
      window.history.replaceState(null, "", window.location.pathname);
      setReady(true);
    };
    if (hash && hash.includes("access_token")) {
      (async () => {
        const { error } = await supabase.auth.setSession({
          access_token: new URLSearchParams(hash.slice(1)).get("access_token") || "",
          refresh_token: new URLSearchParams(hash.slice(1)).get("refresh_token") || "",
        });
        if (error) {
          toast.error("Invalid or expired reset link");
          return;
        }
        markReady();
      })();
    } else {
      markReady();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setDone(true);
      toast.success("Password updated successfully");
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute inset-0 bg-mesh-1 opacity-50" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full max-w-sm"
      >
        <GlassCard variant="noise" className="p-8">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-teal to-brand-green shadow-[var(--shadow-glow-teal)]">
              <Sparkles className="size-6 text-white" />
            </div>
            {done ? (
              <>
                <div className="flex size-12 items-center justify-center rounded-full bg-brand-teal/15 text-brand-teal">
                  <CheckCircle2 className="size-7" />
                </div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight">
                  Password updated
                </h1>
                <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl font-extrabold tracking-tight">
                  Set new password
                </h1>
                <p className="text-sm text-muted-foreground">Must be at least 8 characters</p>
              </>
            )}
          </div>

          {!ready ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Verifying link...</p>
          ) : !done ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="password" className="text-sm font-medium">
                    New password
                  </FieldLabel>
                  <PasswordField
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm" className="text-sm font-medium">
                    Confirm new password
                  </FieldLabel>
                  <PasswordField
                    id="confirm"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </Field>
              </FieldGroup>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                disabled={loading || !password || !confirm}
                className="w-full font-display"
              >
                {loading ? <Spinner /> : <ArrowRight />}
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>
          ) : null}

          <FieldDescription className="pt-6 text-center text-sm">
            <Link
              href="/login"
              prefetch={false}
              className="font-semibold text-brand-teal hover:underline"
            >
              Back to sign in
            </Link>
          </FieldDescription>
        </GlassCard>
      </motion.div>
    </div>
  );
}
