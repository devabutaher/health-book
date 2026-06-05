"use client";

import { use, useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import {
  useGetChallengeQuery,
  useJoinChallengeMutation,
  useLeaveChallengeMutation,
  useDeleteChallengeMutation,
  useGetLeaderboardQuery,
  useToggleSaveChallengeMutation,
  useShareChallengeMutation,
  useGetCalendarQuery,
  useGetBeforeAfterQuery,
} from "@/redux/api/challengesApi";
import { ChallengeProgress } from "@/components/challenges/ChallengeProgress";
import { ChallengeCalendar } from "@/components/challenges/ChallengeCalendar";
import { CheckInModal } from "@/components/challenges/CheckInModal";
import { ChallengeActivityFeed } from "@/components/challenges/ChallengeActivityFeed";
import { BeforeAfterSection } from "@/components/challenges/BeforeAfterSection";
import { ChallengeLeaderboard } from "@/components/challenges/ChallengeLeaderboard";
import { ChallengeComments } from "@/components/challenges/ChallengeComments";
import { ChallengeInviteModal } from "@/components/challenges/ChallengeInviteModal";
import { DailyStreakTracker } from "@/components/challenges/DailyStreakTracker";
import { ChallengeBadge } from "@/components/challenges/ChallengeBadge";
import { DuelHeader } from "@/components/challenges/DuelHeader";
import { EditChallengeModal } from "@/components/challenges/EditChallengeModal";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Users,
  CalendarDays,
  CheckCircle,
  LogOut,
  Trash2,
  Pencil,
  MoreHorizontal,
  Bookmark,
  Share2,
  UserPlus,
  Swords,
  AlertCircle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/hooks";
import { useChallengeRealtime } from "@/hooks/useChallengeRealtime";
import { useSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";
import { getChallengeDayElapsed } from "@/lib/getChallengeDay";

export default function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const { data: challenge, isLoading, isError } = useGetChallengeQuery(id);
  const { data: leaderboard } = useGetLeaderboardQuery(id, { skip: !id });
  const { data: calendar } = useGetCalendarQuery(id, { skip: !id });
  const { data: beforeAfter } = useGetBeforeAfterQuery(id, { skip: !id });
  const [joinChallenge, { isLoading: joining }] = useJoinChallengeMutation();
  const [leaveChallenge, { isLoading: leaving }] = useLeaveChallengeMutation();
  const [deleteChallenge, { isLoading: deleting }] = useDeleteChallengeMutation();
  const [toggleSave] = useToggleSaveChallengeMutation();
  const [shareChallenge] = useShareChallengeMutation();
  const [checkInDay, setCheckInDay] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [badgeDismissed, setBadgeDismissed] = useState(false);
  const badgeEarned = !badgeDismissed && challenge?.myProgress?.completed === true;
  const { play } = useSound();

  const streak = challenge?.myProgress?.streak ?? 0;
  const isCreator = challenge?.createdById === currentUserId;
  const isPastEndDate = challenge ? new Date(challenge.endDate) < new Date() : false;
  const today = challenge
    ? Math.min(getChallengeDayElapsed(challenge.startDate), challenge.dayCount || 30)
    : 1;
  const todayEntry = calendar?.days.find((d) => d.dayNumber === today);
  const todayCheckedIn = todayEntry?.completed === true;

  useChallengeRealtime(id);

  const showCheckIn = useCallback((day: number) => {
    setCheckInDay(day);
  }, []);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-48 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
        </div>
      </ProtectedRoute>
    );
  }

  if (isError) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-4xl py-20 text-center">
          <AlertCircle className="mx-auto mb-4 size-12 text-[var(--text-muted)]" />
          <p className="text-[var(--text-secondary)]">Failed to load challenge</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/challenges")}
            className="mt-4"
          >
            Back to challenges
          </Button>
        </div>
      </ProtectedRoute>
    );
  }

  if (!challenge) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-4xl py-20 text-center text-[var(--text-secondary)]">
          Challenge not found
        </div>
      </ProtectedRoute>
    );
  }

  const daysRemaining = Math.max(
    0,
    // eslint-disable-next-line
    Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / 86400000),
  );

  const handleJoin = async () => {
    play("success");
    try {
      await joinChallenge(id).unwrap();
      toast.success("Joined challenge!");
    } catch {
      play("error");
      toast.error("Failed to join");
    }
  };

  const handleLeave = async () => {
    play("success");
    try {
      await leaveChallenge(id).unwrap();
      toast.success("Left challenge");
      router.push("/challenges");
    } catch {
      play("error");
      toast.error("Failed to leave");
    }
  };

  const handleDelete = async () => {
    play("success");
    try {
      await deleteChallenge(id).unwrap();
      toast.success("Challenge deleted");
      router.push("/challenges");
    } catch {
      play("error");
      toast.error("Failed to delete");
    }
  };

  const handleToggleSave = async () => {
    play("success");
    try {
      await toggleSave(id).unwrap();
    } catch {
      play("error");
    }
  };

  const handleShare = async () => {
    try {
      await shareChallenge({ id }).unwrap();
      const url = `${window.location.origin}/challenges/${id}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to share");
    }
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
        <GlassCard variant="elevated" className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">
                  {challenge.title}
                </h1>
                {challenge.myProgress?.completed && (
                  <CheckCircle className="size-5 text-brand-teal shrink-0" />
                )}
                {challenge.difficulty && (
                  <span
                    className={cn(
                      "rounded-lg px-2 py-0.5 text-[10px] font-semibold",
                      challenge.difficulty === "BEGINNER" && "bg-green-500/10 text-green-500",
                      challenge.difficulty === "INTERMEDIATE" && "bg-amber-500/10 text-amber-500",
                      challenge.difficulty === "ADVANCED" && "bg-red-500/10 text-red-500",
                    )}
                  >
                    {challenge.difficulty}
                  </span>
                )}
                {challenge.category && challenge.category !== "GENERAL" && (
                  <span className="rounded-lg bg-[var(--bg-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                    {challenge.category.replace("_", " ")}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{challenge.description}</p>

              {challenge.groupId && challenge.group && (
                <Link
                  href={`/groups/${challenge.groupId}`}
                  prefetch={false}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-brand-teal hover:underline"
                >
                  <Users className="size-3.5" />
                  {challenge.group.name}
                </Link>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5" />
                  {new Date(challenge.startDate).toLocaleDateString()} –{" "}
                  {new Date(challenge.endDate).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="size-3.5" />
                  {challenge.prize || "No prize"}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  {challenge.participantCount} participants
                </span>
                {daysRemaining > 0 && (
                  <span className="rounded-full bg-brand-amber/10 px-2 py-0.5 font-semibold text-brand-amber">
                    {daysRemaining}d left
                  </span>
                )}
                {challenge.type === "DUEL" && (
                  <span className="rounded-full bg-brand-coral/10 px-2 py-0.5 font-semibold text-brand-coral flex items-center gap-1">
                    <Swords className="size-3" /> Duel
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {!challenge.isJoined ? (
                <Button variant="gradient" size="sm" onClick={handleJoin} disabled={joining} className="w-full sm:w-auto">
                  {joining ? "Joining..." : "Join Challenge"}
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-xl bg-brand-teal/10 px-3 py-1.5 text-xs font-semibold text-brand-teal">
                  <CheckCircle className="size-3.5" /> Joined
                </span>
              )}

              {challenge.isJoined && !isCreator && (
                <button
                  onClick={handleLeave}
                  disabled={leaving}
                  className="flex size-9 sm:size-8 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                  title="Leave challenge"
                >
                  <LogOut className="size-4" />
                </button>
              )}

              <button
                onClick={handleToggleSave}
                className={cn(
                  "flex size-9 sm:size-8 items-center justify-center rounded-xl transition-colors",
                  challenge.isSaved
                    ? "text-brand-teal hover:bg-brand-teal/10"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]",
                )}
                title={challenge.isSaved ? "Unsave" : "Save"}
              >
                <Bookmark className={cn("size-4", challenge.isSaved && "fill-brand-teal")} />
              </button>
              <button
                onClick={handleShare}
                className="flex size-9 sm:size-8 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
                title="Share"
              >
                <Share2 className="size-4" />
              </button>

              {isCreator && (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex size-9 sm:size-8 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
                    title="More options"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 sm:left-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] py-1 shadow-[var(--shadow-lg)]">
                        <button
                          onClick={() => {
                            setEditOpen(true);
                            setMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]"
                        >
                          <Pencil className="size-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDelete();
                            setMenuOpen(false);
                          }}
                          disabled={deleting}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          <Trash2 className="size-3.5" /> {deleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {challenge.myProgress && (
            <div className="mt-4 space-y-3">
              <ChallengeProgress
                progress={challenge.myProgress}
                milestones={challenge.milestones}
              />
            </div>
          )}

          {challenge.isJoined && (
            <div className="mt-4">
              <DailyStreakTracker streak={streak} />
            </div>
          )}
        </GlassCard>

        {/* Duel Header */}
        {challenge.type === "DUEL" && challenge.isJoined && <DuelHeader challengeId={id} />}

        {/* Calendar + Check-In */}
        {challenge.isJoined && calendar && (
          <div className="space-y-3">
            <ChallengeCalendar
              days={calendar.days}
              dayCount={calendar.dayCount}
              startDate={challenge.startDate}
              onDayClick={(day) => {
                const entry = calendar.days.find((d) => d.dayNumber === day);
                if (!entry?.completed) showCheckIn(day);
              }}
            />
            {!isPastEndDate && (
              <Button
                variant="gradient"
                size="sm"
                disabled={todayCheckedIn}
                onClick={() => showCheckIn(today)}
                className="w-full"
              >
                {todayCheckedIn ? "Already Checked In Today" : "Check In Today"}
              </Button>
            )}
          </div>
        )}

        {challenge.type !== "SOLO" && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setInviteOpen(true)}
              className="gap-1.5 w-full sm:w-auto"
            >
              <UserPlus className="size-3.5" /> Invite Friends
            </Button>
          </div>
        )}

        {/* Activity Feed */}
        <ChallengeActivityFeed challengeId={id} />

        {/* Before & After */}
        {challenge.isJoined && beforeAfter && (beforeAfter.before || beforeAfter.after) && (
          <BeforeAfterSection data={beforeAfter} challengeId={id} />
        )}

        <ChallengeComments challengeId={id} />

        <ChallengeLeaderboard
          entries={leaderboard || []}
          isDuel={challenge.type === "DUEL"}
          dayCount={challenge.dayCount || 30}
          goalTarget={challenge.goalTarget}
          goalUnit={challenge.goalUnit}
        />
      </div>

      {checkInDay && challenge && (
        <CheckInModal
          challengeId={id}
          dayNumber={checkInDay}
          totalDays={challenge.dayCount || 30}
          open={!!checkInDay}
          onClose={() => setCheckInDay(null)}
          existingEntry={calendar?.days.find((d) => d.dayNumber === checkInDay) ?? null}
          goalTarget={challenge.goalTarget}
          goalUnit={challenge.goalUnit}
        />
      )}
      {editOpen && (
        <EditChallengeModal
          key={challenge.id}
          challenge={challenge}
          onClose={() => setEditOpen(false)}
        />
      )}
      <ChallengeBadge earned={badgeEarned} onClose={() => setBadgeDismissed(true)} />
      <ChallengeInviteModal
        challengeId={id}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </ProtectedRoute>
  );
}
