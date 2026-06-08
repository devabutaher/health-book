"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useForgotPasswordMutation } from "@/redux/api/authApi";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { GlassCard } from "@/components/ui/glass-card";
import { Spinner } from "@/components/ui/spinner";

export default function ForgotPasswordPage() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    try {
      await forgotPassword({ email }).unwrap();
      setSent(true);
      toast.success("Reset link sent to your email");
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || "Something went wrong";
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
        className="relative w-full max-w-sm"
      >
        <GlassCard variant="noise" className="p-8">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-teal to-brand-green shadow-[var(--shadow-glow-teal)]">
              <Sparkles className="size-6 text-white" />
            </div>
            {sent ? (
              <>
                <div className="flex size-12 items-center justify-center rounded-full bg-brand-teal/15 text-brand-teal">
                  <CheckCircle2 className="size-7" />
                </div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight">
                  Check your email
                </h1>
                <p className="text-sm text-muted-foreground">
                  We sent a password reset link to{" "}
                  <strong className="text-foreground">{email}</strong>
                </p>
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl font-extrabold tracking-tight">
                  Forgot password?
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </>
            )}
          </div>

          {!sent ? (
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
              </FieldGroup>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                disabled={isLoading}
                className="w-full font-display"
              >
                {isLoading ? <Spinner /> : <ArrowRight />}
                {isLoading ? "Sending..." : "Send reset link"}
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
