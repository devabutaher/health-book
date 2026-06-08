"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2, Copy, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { staggerItem } from "@/lib/motion/variants";
import {
  useDeleteHealthLogMutation,
  useCopyHealthLogMutation,
  useShareHealthLogMutation,
  type HealthLog,
} from "@/redux/api/healthLogApi";
import { useAppSelector } from "@/hooks";
import { getTemplate } from "./templates";

const moodEmojis = ["", "😞", "😕", "😐", "😊", "😄"];

export default function HealthLogCard({
  log,
  ownerName,
  ownerUsername,
  ownerAvatar,
  isVerified,
}: {
  log: HealthLog;
  ownerName?: string;
  ownerUsername?: string;
  ownerAvatar?: string | null;
  isVerified?: boolean;
}) {
  const tpl = getTemplate(log.type);
  const data = (log.data || {}) as Record<string, unknown>;
  const currentUser = useAppSelector((s) => s.auth.user);
  const isOwner = currentUser?.id === log.userId;
  const [deleteLog] = useDeleteHealthLogMutation();
  const [copyLog, { isLoading: copying }] = useCopyHealthLogMutation();
  const [shareLog, { isLoading: sharing }] = useShareHealthLogMutation();

  const handleDelete = async () => {
    try {
      await deleteLog(log.id).unwrap();
      toast.success("Log deleted");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete"));
    }
  };
  const handleCopy = async () => {
    try {
      await copyLog(log.id).unwrap();
      toast.success("Copied to your My Book");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to copy"));
    }
  };
  const handleShare = async () => {
    try {
      await shareLog({
        id: log.id,
        content: `Just logged my ${tpl.shortLabel}! #healthbook`,
      }).unwrap();
      toast.success("Shared to feed");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to share"));
    }
  };

  return (
    <motion.div variants={staggerItem}>
      <GlassCard
        variant="subtle"
        className="relative overflow-hidden p-3 sm:p-4 pl-5"
        style={{
          boxShadow: `0 4px 24px -8px ${tpl.glow}`,
          borderColor: `color-mix(in oklch, ${tpl.accent} 20%, transparent)`,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-1.5 rounded-l-2xl"
          style={{
            background: `linear-gradient(180deg, ${tpl.accent}, color-mix(in oklch, ${tpl.accent} 50%, transparent))`,
          }}
        />
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {ownerName && ownerUsername ? (
              <Link
                href={`/${ownerUsername}`}
                prefetch={false}
                className="flex items-center gap-2.5"
              >
                <UserAvatar
                  name={ownerName}
                  avatar={ownerAvatar ?? null}
                  ring={isVerified ? "premium" : "default"}
                  size="sm"
                />
                <div>
                  <div className="text-sm font-semibold">{ownerName}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    {format(new Date(log.date), "MMM d, yyyy")}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2.5">
                <span
                  className="flex size-9 items-center justify-center rounded-2xl text-lg"
                  style={{ background: `color-mix(in oklch, ${tpl.accent} 18%, transparent)` }}
                >
                  {tpl.emoji}
                </span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: tpl.text }}>
                    {tpl.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(log.date), "EEE, MMM d")}
                  </div>
                </div>
              </div>
            )}
            {log.score !== null && (
              <Badge
                variant={
                  log.score >= 70 ? "default" : log.score >= 40 ? "secondary" : "destructive"
                }
                className="ml-1 font-mono text-xs"
              >
                {log.score}
              </Badge>
            )}
          </div>
          {(isOwner || currentUser) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Options">
                  <Pencil />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopy} disabled={copying}>
                  <Copy /> Copy to my book
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare} disabled={sharing}>
                  <Pencil /> Share to feed
                </DropdownMenuItem>
                {isOwner && (
                  <DropdownMenuItem onClick={handleDelete} variant="destructive">
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mt-3 space-y-1 text-sm text-foreground/90">
          {log.type === "ROUTINE" && (
            <>
              <p>
                🛏️ <span className="text-muted-foreground">Wake</span>{" "}
                {String(data.wakeTime || "—")} <span className="text-muted-foreground">·</span>{" "}
                <span className="text-muted-foreground">Sleep</span> {String(data.sleepTime || "—")}
              </p>
              <p>
                💧 <span className="text-muted-foreground">Water</span>{" "}
                {String(data.waterIntake || 0)} glasses{" "}
                <span className="text-muted-foreground">·</span> 📱{" "}
                <span className="text-muted-foreground">Screen</span> {String(data.screenTime || 0)}
                h
              </p>
            </>
          )}
          {log.type === "GOAL" && (
            <p>
              {Array.isArray(data.items) ? (
                <span>
                  {data.items.filter((i: { completed: boolean }) => i.completed).length}/
                  {data.items.length} complete
                </span>
              ) : (
                "No goals"
              )}
            </p>
          )}
          {log.type === "WORKOUT" && (
            <>
              <p>
                🏃 {String(data.activityType || "—")}{" "}
                <span className="text-muted-foreground">·</span> {String(data.duration || 0)}min
              </p>
              <p>
                🔥 {String(data.calories || 0)} cal <span className="text-muted-foreground">·</span>{" "}
                ⚡ Intensity {String(data.intensity || 0)}/10
              </p>
            </>
          )}
          {log.type === "MOOD" && (
            <p>
              {moodEmojis[data.mood as number] || "😐"} Mood {String(data.mood || "—")}/5
              <span className="text-muted-foreground"> ·</span> Stress{" "}
              {String(data.stressLevel || "—")}/10
            </p>
          )}
          {log.type === "QUICK" && (
            <>
              {(data.type as string) === "water" && <p>💧 {String(data.glasses || 0)} glasses</p>}
              {(data.type as string) === "sleep" && (
                <p>
                  🛏️ {String(data.sleepHours || 0)}h{" "}
                  <span className="text-muted-foreground">·</span> Quality{" "}
                  {String(data.sleepQuality || 0)}/5
                </p>
              )}
              {!["water", "sleep"].includes(data.type as string) && <p>Quick log</p>}
            </>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
