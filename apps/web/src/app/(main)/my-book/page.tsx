"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Plus,
  Flame,
  Heart,
  Activity,
  Trophy,
  FileText,
  Target,
  Dumbbell,
  Brain,
  Zap,
  Send,
  Sparkles,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { GlassCard } from "@/components/ui/glass-card";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import TemplateSelector from "@/components/health/TemplateSelector";
import HealthLogCard from "@/components/health/HealthLogCard";
import HealthCalendar from "@/components/health/HealthCalendar";
import StreakBadges from "@/components/health/StreakBadges";
import WorkoutHistoryTable from "@/components/health/WorkoutHistoryTable";

const RoutineForm = dynamic(() => import("@/components/health/RoutineForm"));
const GoalForm = dynamic(() => import("@/components/health/GoalForm"));
const WorkoutForm = dynamic(() => import("@/components/health/WorkoutForm"));
const MoodForm = dynamic(() => import("@/components/health/MoodForm"));
const QuickForm = dynamic(() => import("@/components/health/QuickForm"));
const CalorieChart = dynamic(() => import("@/components/health/CalorieChart"), { ssr: false });
const MoodChart = dynamic(() => import("@/components/health/MoodChart"), { ssr: false });
const GoalChart = dynamic(() => import("@/components/health/GoalChart"), { ssr: false });
import { useAppSelector } from "@/hooks";
import { useHealthLogRealtime } from "@/hooks/useHealthLogRealtime";
import { useSound } from "@/hooks/useSound";
import {
  useGetHealthLogsQuery,
  useGetHealthStatsQuery,
  useCreateHealthLogMutation,
  useShareHealthLogMutation,
  type HealthLog,
} from "@/redux/api/healthLogApi";
import { useGetMyChallengesQuery, useGetDayPlansQuery } from "@/redux/api/challengesApi";
import { ChallengeGoalDisplay } from "@/components/challenges/ChallengeGoalDisplay";
import { ChallengeStatsCard } from "@/components/challenges/ChallengeStatsCard";
import { CheckInModal } from "@/components/challenges/CheckInModal";
import Link from "next/link";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";

const BMICalculator = dynamic(() => import("@/components/health/BMICalculator"), { ssr: false });
const SleepLogger = dynamic(() => import("@/components/health/SleepLogger"), { ssr: false });
const WaterWidget = dynamic(() => import("@/components/health/WaterWidget"), { ssr: false });
const MedicineReminder = dynamic(() => import("@/components/health/MedicineReminder"), {
  ssr: false,
});
const PeriodTracker = dynamic(() => import("@/components/health/PeriodTracker"), { ssr: false });
const WeightTracker = dynamic(() => import("@/components/health/WeightTracker"), { ssr: false });
const StreakAtRiskAlert = dynamic(() => import("@/components/health/StreakAtRiskAlert"), {
  ssr: false,
});
import { getTemplate, TEMPLATE_ORDER } from "@/components/health/templates";

const TEMPLATE_ICON: Record<string, typeof FileText> = {
  ROUTINE: FileText,
  GOAL: Target,
  WORKOUT: Dumbbell,
  MOOD: Brain,
  QUICK: Zap,
};

function HealthScoreRing({ score }: { score: number }) {
  const target = Math.max(0, Math.min(100, score));
  const v = useMotionValue(0);
  const display = useTransform(v, (latest) => Math.round(latest));
  const [shown, setShown] = useState(0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (target / 100) * circumference;

  useEffect(() => {
    const controls = animate(v, target, { duration: 1.2, ease: "easeOut" });
    return () => controls.stop();
  }, [target, v]);

  useEffect(() => {
    const unsub = display.on("change", (latest) => setShown(latest));
    return () => unsub();
  }, [display]);

  const color =
    target >= 80
      ? "oklch(0.696 0.17 162.48)"
      : target >= 50
        ? "oklch(0.78 0.18 80)"
        : "oklch(0.65 0.22 25)";

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      <svg width="160" height="160" className="-rotate-90">
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.696 0.17 162.48)" />
            <stop offset="100%" stopColor="oklch(0.696 0.17 200)" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r={60} fill="none" stroke="var(--bg-overlay)" strokeWidth="10" />
        <circle
          cx="80"
          cy="80"
          r={60}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 60}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-4xl font-extrabold tracking-tight">{shown}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Health Score
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  unit?: string;
  icon: React.ReactNode;
  gradient: string;
  glow: string;
  suffix?: string;
}

function StatCard({ label, value, unit, icon, gradient, glow, suffix }: StatCardProps) {
  return (
    <motion.div variants={staggerItem}>
      <GlassCard
        variant="default"
        className="relative overflow-hidden p-4"
        style={{ boxShadow: `0 8px 24px -10px ${glow}` }}
      >
        <div aria-hidden className="absolute inset-0 opacity-20" style={{ background: gradient }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-3xl font-extrabold tracking-tight">{value}</span>
              {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
              {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
            </div>
          </div>
          <div
            className="flex size-10 items-center justify-center rounded-2xl text-white"
            style={{ background: gradient }}
          >
            {icon}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function ActiveChallengesSection() {
  const { data: myChallengesData, isLoading } = useGetMyChallengesQuery();
  const myChallenges = myChallengesData?.data ?? [];
  const [now] = useState(() => Date.now());
  const [logChallenge, setLogChallenge] = useState<{
    id: string;
    day: number;
    total: number;
    goalTarget?: number | null;
    goalUnit?: string | null;
  } | null>(null);
  const { data: logDayPlans } = useGetDayPlansQuery(logChallenge?.id || "", {
    skip: !logChallenge?.id,
  });
  const active = (myChallenges || []).filter((c) => !c.myProgress?.completed);

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!active.length) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">
          <span className="text-gradient-primary">Active Challenges</span>
        </h2>
        <Link
          href="/challenges"
          prefetch={false}
          className="text-xs font-semibold text-brand-teal hover:text-brand-teal/80 transition-colors"
        >
          View all &rarr;
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {active.slice(0, 4).map((c) => {
          const daysLeft = Math.max(0, Math.ceil((new Date(c.endDate).getTime() - now) / 86400000));
          const isPastEndDate = new Date(c.endDate) < new Date(now);
          const canLog = !!c.myProgress && !c.myProgress.completed && !isPastEndDate;
          return (
            <div
              key={c.id}
              className="group relative overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] transition-all duration-300 hover:border-brand-teal/30 hover:shadow-[var(--shadow-lg)]"
            >
              <Link href={`/challenges/${c.id}`} prefetch={false} className="block p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {c.title}
                  </h3>
                  {c.type === "SOLO" && <Target className="size-3.5 shrink-0 text-brand-blue" />}
                  {c.type === "GROUP" && <Users className="size-3.5 shrink-0 text-brand-teal" />}
                  {c.type === "PLATFORM" && (
                    <Trophy className="size-3.5 shrink-0 text-brand-amber" />
                  )}
                </div>
                {c.myProgress && (
                  <div className="mt-3">
                    <ChallengeGoalDisplay
                      score={c.myProgress.score}
                      goal={c.myProgress.goal}
                      unit={c.goalUnit || ""}
                    />
                    <div className="mb-1 flex justify-between text-[10px] mt-1">
                      <span className="text-[var(--text-muted)]">
                        {Math.round(c.myProgress.pct)}%
                      </span>
                      <span className="font-semibold text-brand-amber">{daysLeft}d left</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-teal to-brand-green transition-all"
                        style={{ width: `${Math.min(c.myProgress.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {!c.myProgress && (
                  <div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                    <Users className="size-3" />
                    {c.participantCount} participants
                  </div>
                )}
              </Link>
              {canLog && (
                <div className="absolute bottom-3 right-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLogChallenge({
                        id: c.id,
                        day: (c.myProgress?.score || 0) + 1,
                        total: c.dayCount || 30,
                        goalTarget: c.goalTarget,
                        goalUnit: c.goalUnit,
                      });
                    }}
                    className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand-teal to-brand-green px-2.5 py-1 text-[10px] font-bold text-white shadow-[var(--shadow-glow-teal)] transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus className="size-3" /> Log
                  </button>
                </div>
              )}
              {c.myProgress?.completed && (
                <div className="absolute bottom-3 right-3">
                  <span className="flex items-center gap-1 rounded-lg bg-brand-teal/10 px-2 py-1 text-[10px] font-semibold text-brand-teal">
                    <CheckCircle className="size-3" /> Done
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {logChallenge && (
        <CheckInModal
          challengeId={logChallenge.id}
          currentDay={logChallenge.day}
          totalDays={logChallenge.total}
          open={!!logChallenge}
          onClose={() => setLogChallenge(null)}
          goalTarget={logChallenge.goalTarget}
          goalUnit={logChallenge.goalUnit}
          dayPlan={logDayPlans?.find((p) => p.dayNumber === logChallenge.day) ?? null}
          hasDayPlans={!!logDayPlans && logDayPlans.length > 0}
        />
      )}
    </section>
  );
}

export default function MyBookPage() {
  const [showSelector, setShowSelector] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [shareDialog, setShareDialog] = useState<{ logId: string; type: string } | null>(null);
  const [shareContent, setShareContent] = useState("");
  const user = useAppSelector((s) => s.auth.user);
  useHealthLogRealtime();

  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useGetHealthStatsQuery(undefined);
  const {
    data: logsData,
    isLoading: logsLoading,
    isError: logsError,
    refetch: refetchLogs,
  } = useGetHealthLogsQuery({ limit: 50 });
  const [createLog] = useCreateHealthLogMutation();
  const [shareLog, { isLoading: sharing }] = useShareHealthLogMutation();
  const { play } = useSound();

  const stats = statsData?.data;
  const logs = (logsData?.logs || []) as HealthLog[];

  const handleTemplateSelect = (type: string) => setActiveTemplate(type);

  const handleFormSubmit = async (formData: Record<string, unknown>) => {
    if (!activeTemplate) return;
    play("post-publish");
    try {
      const result = await createLog({
        type: activeTemplate as "ROUTINE" | "GOAL" | "WORKOUT" | "MOOD" | "QUICK",
        data: formData,
        isPublic: false,
      }).unwrap();
      toast.success("Health log saved!");
      setActiveTemplate(null);
      const newId = (result as { data: { id: string } }).data.id;
      if (newId) {
        setShareDialog({ logId: newId, type: activeTemplate });
        setShareContent(
          `Just logged my ${getTemplate(activeTemplate as HealthLog["type"]).shortLabel}! #healthbook`,
        );
      }
    } catch (err) {
      play("error");
      toast.error(getErrorMessage(err, "Failed to save health log"));
    }
  };

  const handleShare = async () => {
    if (!shareDialog) return;
    play("post-publish");
    try {
      await shareLog({ id: shareDialog.logId, content: shareContent }).unwrap();
      toast.success("Shared to feed!");
      setShareDialog(null);
    } catch (err) {
      play("error");
      toast.error(getErrorMessage(err, "Failed to share"));
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            <span className="text-gradient-primary">My Book</span>
          </h1>
          <p className="text-sm text-muted-foreground">Your health journey, all in one place</p>
        </div>
        <Button
          onClick={() => setShowSelector(true)}
          variant="gradient"
          size="lg"
          className="gap-2"
        >
          <Plus className="size-4" />
          Log Health
        </Button>
      </div>

      <TemplateSelector
        open={showSelector}
        onOpenChange={setShowSelector}
        onSelect={handleTemplateSelect}
      />

      <AnimatePresence>
        {activeTemplate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-2">
              {activeTemplate === "ROUTINE" && (
                <RoutineForm
                  onSubmit={(d) => handleFormSubmit(d as unknown as Record<string, unknown>)}
                  onCancel={() => setActiveTemplate(null)}
                />
              )}
              {activeTemplate === "GOAL" && (
                <GoalForm
                  onSubmit={(d) => handleFormSubmit(d as unknown as Record<string, unknown>)}
                  onCancel={() => setActiveTemplate(null)}
                />
              )}
              {activeTemplate === "WORKOUT" && (
                <WorkoutForm
                  onSubmit={(d) => handleFormSubmit(d as unknown as Record<string, unknown>)}
                  onCancel={() => setActiveTemplate(null)}
                />
              )}
              {activeTemplate === "MOOD" && (
                <MoodForm
                  onSubmit={(d) => handleFormSubmit(d as unknown as Record<string, unknown>)}
                  onCancel={() => setActiveTemplate(null)}
                />
              )}
              {activeTemplate === "QUICK" && (
                <QuickForm
                  onSubmit={(d) => handleFormSubmit(d as unknown as Record<string, unknown>)}
                  onCancel={() => setActiveTemplate(null)}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <StreakAtRiskAlert />

      {statsError ? (
        <GlassCard className="p-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-[var(--bg-subtle)]">
            <AlertCircle className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Couldn&apos;t load your health stats.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchStats()}>
            <RefreshCw /> Retry
          </Button>
        </GlassCard>
      ) : statsLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            label="Current Streak"
            value={stats?.streak || 0}
            suffix="days"
            icon={<Flame className="size-5" />}
            gradient="linear-gradient(135deg, oklch(0.78 0.18 60), oklch(0.65 0.22 25))"
            glow="oklch(0.78 0.18 60 / 0.4)"
          />
          <StatCard
            label="Health Score"
            value={stats?.healthScore || 0}
            unit="/100"
            icon={<Heart className="size-5" />}
            gradient="linear-gradient(135deg, oklch(0.696 0.17 162.48), oklch(0.696 0.17 200))"
            glow="oklch(0.696 0.17 162.48 / 0.4)"
          />
          <StatCard
            label="Total Logs"
            value={stats?.totalLogs || 0}
            suffix="last 30d"
            icon={<Activity className="size-5" />}
            gradient="linear-gradient(135deg, oklch(0.696 0.17 220), oklch(0.696 0.17 280))"
            glow="oklch(0.696 0.17 220 / 0.4)"
          />
          <StatCard
            label="Avg Score"
            value={stats?.avgScore || 0}
            unit="/100"
            icon={<Trophy className="size-5" />}
            gradient="linear-gradient(135deg, oklch(0.78 0.18 80), oklch(0.78 0.18 60))"
            glow="oklch(0.78 0.18 80 / 0.4)"
          />
        </motion.div>
      )}

      <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr]">
        <GlassCard variant="subtle" className="relative overflow-hidden p-5">
          <div
            aria-hidden
            className="absolute inset-0 opacity-10"
            style={{ background: "linear-gradient(135deg, var(--brand-teal), var(--brand-blue))" }}
          />
          <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
            {statsLoading ? (
              <Skeleton className="size-40 rounded-full" />
            ) : (
              <HealthScoreRing score={stats?.healthScore || 0} />
            )}
            <div className="flex-1">
              <h2 className="font-display text-xl font-bold">Today at a glance</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {stats?.totalLogs ? (
                  <>
                    You&apos;ve logged{" "}
                    <strong className="text-foreground">{stats.totalLogs}</strong> health events in
                    the last 30 days. Keep it up!
                  </>
                ) : (
                  <>Start logging to build your health profile and unlock insights.</>
                )}
              </p>
              {stats?.byType && stats.byType.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {stats.byType
                    .slice(0, 4)
                    .map((t: { type: string; count: number; avgScore: number }) => {
                      const meta = getTemplate(t.type as HealthLog["type"]);
                      const Icon = TEMPLATE_ICON[t.type] || FileText;
                      return (
                        <div key={t.type} className="flex items-center gap-2">
                          <div
                            className="flex size-6 items-center justify-center rounded-lg"
                            style={{
                              background: `color-mix(in oklch, ${meta.accent} 18%, transparent)`,
                              color: meta.text,
                            }}
                          >
                            <Icon className="size-3" />
                          </div>
                          <span className="flex-1 text-xs">{meta.shortLabel}</span>
                          <span className="text-xs text-muted-foreground">{t.count} logs</span>
                          <span
                            className="font-mono text-xs font-semibold tabular-nums"
                            style={{ color: meta.text }}
                          >
                            {t.avgScore}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </GlassCard>
        <HealthCalendar />
      </div>

      <ActiveChallengesSection />

      <ChallengeStatsCard />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <CalorieChart />
        <MoodChart />
        <GoalChart />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <BMICalculator />
        <SleepLogger />
        <WaterWidget />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MedicineReminder />
        {user?.gender === "female" && <PeriodTracker />}
        <WeightTracker />
      </div>

      <WorkoutHistoryTable />
      <StreakBadges streak={stats?.streak || 0} />

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full overflow-x-auto sm:w-auto">
          <TabsTrigger value="all" className="gap-1.5">
            <FileText className="size-3.5" />
            All
          </TabsTrigger>
          {TEMPLATE_ORDER.map((k) => {
            const Icon = TEMPLATE_ICON[k] || FileText;
            return (
              <TabsTrigger key={k} value={k} className="gap-1.5">
                <Icon className="size-3.5" />
                {getTemplate(k).shortLabel}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {["all", ...TEMPLATE_ORDER].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-3 space-y-3">
            {logsError ? (
              <Empty>
                <EmptyMedia variant="gradient">
                  <AlertCircle />
                </EmptyMedia>
                <EmptyTitle>Couldn&apos;t load logs</EmptyTitle>
                <EmptyDescription>Check your connection and try again.</EmptyDescription>
                <Button variant="outline" size="sm" onClick={() => refetchLogs()}>
                  <RefreshCw /> Retry
                </Button>
              </Empty>
            ) : logsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-3"
              >
                {logs
                  .filter((l) => tab === "all" || l.type === tab)
                  .map((log) => (
                    <HealthLogCard key={log.id} log={log} />
                  ))}
              </motion.div>
            )}
            {!logsLoading && logs.filter((l) => tab === "all" || l.type === tab).length === 0 && (
              <Empty>
                <EmptyMedia variant="gradient">
                  <Sparkles />
                </EmptyMedia>
                <EmptyTitle>No logs here yet</EmptyTitle>
                <EmptyDescription>
                  Hit the &quot;Log Health&quot; button to start tracking this category.
                </EmptyDescription>
              </Empty>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!shareDialog} onOpenChange={(o) => !o && setShareDialog(null)}>
        <DialogContent
          className="sm:max-w-lg max-h-[85vh] overflow-y-auto"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle className="font-display">Share to Feed?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Share your{" "}
              {shareDialog ? getTemplate(shareDialog.type as HealthLog["type"]).shortLabel : ""} log
              as a post?
            </p>
            <Input
              value={shareContent}
              onChange={(e) => setShareContent(e.target.value)}
              placeholder="Write a caption..."
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShareDialog(null)}>
                Skip
              </Button>
              <Button variant="gradient" onClick={handleShare} disabled={sharing}>
                {sharing ? <Spinner /> : <Send />}
                {sharing ? "Sharing..." : "Share to Feed"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
