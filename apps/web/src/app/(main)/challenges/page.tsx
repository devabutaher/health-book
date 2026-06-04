"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Trophy,
  Target,
  Search,
  LayoutTemplate,
  Sparkles,
  Bookmark,
  AlertCircle,
} from "lucide-react";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { CreateChallengeModal } from "@/components/challenges/CreateChallengeModal";
import { CheckInModal } from "@/components/challenges/CheckInModal";
import { ChallengeFilterBar } from "@/components/challenges/ChallengeFilterBar";
import {
  useBrowseChallengesQuery,
  useSearchChallengesQuery,
  useGetMyChallengesQuery,
  useGetSavedChallengesQuery,
  useToggleSaveChallengeMutation,
} from "@/redux/api/challengesApi";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import type { ChallengeDifficulty } from "@/types/challenge";

const categories = [
  { value: undefined, label: "All", icon: Sparkles },
  { value: "FITNESS", label: "Fitness", icon: Target },
  { value: "NUTRITION", label: "Nutrition", icon: Trophy },
  { value: "MENTAL_HEALTH", label: "Mental", icon: Target },
  { value: "SLEEP", label: "Sleep", icon: Target },
];

export default function ChallengesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [difficultyFilter, setDifficultyFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [logChallengeId, setLogChallengeId] = useState<string | null>(null);
  const [logDayNumber, setLogDayNumber] = useState(1);
  const [logTotalDays, setLogTotalDays] = useState(30);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [showTemplates, setShowTemplates] = useState(false);
  const [toggleSave] = useToggleSaveChallengeMutation();

  const isSearching = debouncedSearch.trim().length > 0;

  const { data, isLoading, isFetching, isError } = useBrowseChallengesQuery(
    {
      type: typeFilter,
      category: categoryFilter,
      difficulty: difficultyFilter as ChallengeDifficulty | undefined,
      cursor,
    },
    { skip: isSearching },
  );
  const {
    data: searchData,
    isFetching: isSearchingState,
    isError: isSearchError,
  } = useSearchChallengesQuery({ q: debouncedSearch.trim(), cursor }, { skip: !isSearching });
  const { data: myChallenges, isLoading: myLoading, isError: myError } = useGetMyChallengesQuery();
  const {
    data: savedChallenges,
    isLoading: savedLoading,
    isError: savedError,
  } = useGetSavedChallengesQuery();

  const activeData = isSearching ? searchData : data;
  const activeLoading = isSearching ? isSearchingState : isLoading;

  const handleFilterChange = useCallback((filter: string | undefined) => {
    setTypeFilter(filter);
    setCursor(undefined);
  }, []);

  const handleDifficultyChange = useCallback((diff: string | undefined) => {
    setDifficultyFilter(diff);
    setCursor(undefined);
  }, []);

  const handleCategoryChange = useCallback((cat: string | undefined) => {
    setCategoryFilter(cat);
    setCursor(undefined);
  }, []);

  const loadMore = useCallback(() => {
    if (activeData?.nextCursor) setCursor(activeData.nextCursor);
  }, [activeData]);

  const handleToggleSave = async (id: string) => {
    try {
      await toggleSave(id).unwrap();
    } catch {}
  };

  const handleLogProgress = (challengeId: string) => {
    const challenge = activeData?.challenges.find((c) => c.id === challengeId);
    if (challenge) {
      setLogChallengeId(challengeId);
      setLogDayNumber(challenge.myProgress ? challenge.myProgress.score + 1 : 1);
      setLogTotalDays(challenge.dayCount || 30);
    }
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl">
        {/* Hero header */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-teal/10 via-brand-blue/5 to-brand-green/10 p-8">
          <div className="relative z-10">
            <h1 className="font-display text-4xl font-extrabold tracking-tight">
              <span className="text-gradient-primary">Challenges</span>
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-lg">
              Push your limits, track your progress, and earn badges. Solo or with friends — every
              day is a challenge!
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="gradient" onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="size-4" /> Create Challenge
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowTemplates(true);
                  setCreateOpen(true);
                }}
                className="gap-2"
              >
                <LayoutTemplate className="size-4" /> From Template
              </Button>
            </div>
          </div>
          <div className="absolute -right-8 -top-8 size-40 rounded-full bg-brand-teal/10 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-brand-amber/10 blur-3xl" />
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCursor(undefined);
            }}
            placeholder="Search challenges by title or description..."
            className="w-full rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] shadow-[var(--shadow-card)] focus:border-brand-teal/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/10"
          />
        </div>

        <Tabs defaultValue="browse" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="browse" className="gap-1.5">
              <Trophy className="size-3.5" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="mine" className="gap-1.5">
              <Target className="size-3.5" />
              My Challenges
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-1.5">
              <Bookmark className="size-3.5" />
              Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-3 sm:space-y-4">
            {/* Category filter chips */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = categoryFilter === cat.value;
                return (
                  <button
                    key={cat.label}
                    onClick={() => handleCategoryChange(cat.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
                      isActive
                        ? "bg-gradient-to-r from-brand-teal to-brand-green text-white shadow-[var(--shadow-glow-teal)]"
                        : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <ChallengeFilterBar
              activeType={typeFilter}
              activeDifficulty={difficultyFilter}
              onTypeChange={handleFilterChange}
              onDifficultyChange={handleDifficultyChange}
            />

            {(isSearching ? isSearchError : isError) ? (
              <GlassCard variant="subtle" className="flex flex-col items-center py-20 text-center">
                <AlertCircle className="mb-4 size-12 text-[var(--text-muted)]" />
                <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
                  Something went wrong
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Failed to load challenges. Please try again.
                </p>
              </GlassCard>
            ) : activeLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-44 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
                ))}
              </div>
            ) : !activeData?.challenges?.length ? (
              <GlassCard variant="subtle" className="flex flex-col items-center py-20 text-center">
                <Trophy className="mb-4 size-12 text-[var(--text-muted)]" />
                <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
                  {isSearching ? "No results found" : "No challenges yet"}
                </h3>
                <p className="mb-6 text-sm text-[var(--text-secondary)]">
                  {isSearching ? "Try a different search term" : "Create the first one"}
                </p>
                <Button variant="gradient" onClick={() => setCreateOpen(true)}>
                  <Plus /> Create Challenge
                </Button>
              </GlassCard>
            ) : (
              <>
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  {activeData.challenges.map((c) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <ChallengeCard
                        challenge={c}
                        onLogProgress={handleLogProgress}
                        onToggleSave={handleToggleSave}
                      />
                    </motion.div>
                  ))}
                </div>

                {activeData.hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button variant="secondary" onClick={loadMore} disabled={isFetching}>
                      {isFetching ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="mine" className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
            {myLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-44 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
                ))}
              </div>
            ) : myError ? (
              <GlassCard variant="subtle" className="flex flex-col items-center py-20 text-center">
                <AlertCircle className="mb-4 size-12 text-[var(--text-muted)]" />
                <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
                  Failed to load
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Could not load your challenges.
                </p>
              </GlassCard>
            ) : !myChallenges?.length ? (
              <GlassCard variant="subtle" className="flex flex-col items-center py-20 text-center">
                <Target className="mb-4 size-12 text-[var(--text-muted)]" />
                <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
                  Not in any challenge
                </h3>
                <p className="mb-6 text-sm text-[var(--text-secondary)]">
                  Join or create one to get started
                </p>
              </GlassCard>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {myChallenges.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <ChallengeCard
                      challenge={c}
                      onLogProgress={handleLogProgress}
                      onToggleSave={handleToggleSave}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
            {savedLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-44 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
                ))}
              </div>
            ) : savedError ? (
              <GlassCard variant="subtle" className="flex flex-col items-center py-20 text-center">
                <AlertCircle className="mb-4 size-12 text-[var(--text-muted)]" />
                <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
                  Failed to load
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Could not load saved challenges.
                </p>
              </GlassCard>
            ) : !savedChallenges?.length ? (
              <GlassCard variant="subtle" className="flex flex-col items-center py-20 text-center">
                <Bookmark className="mb-4 size-12 text-[var(--text-muted)]" />
                <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
                  No saved challenges
                </h3>
                <p className="mb-6 text-sm text-[var(--text-secondary)]">
                  Save challenges to find them later
                </p>
              </GlassCard>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {savedChallenges.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <ChallengeCard
                      challenge={c}
                      onLogProgress={handleLogProgress}
                      onToggleSave={handleToggleSave}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <CreateChallengeModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          showTemplates={showTemplates}
          onCloseTemplates={() => setShowTemplates(false)}
        />
      </div>

      <CheckInModal
        challengeId={logChallengeId || ""}
        dayNumber={logDayNumber}
        totalDays={logTotalDays}
        open={!!logChallengeId}
        onClose={() => setLogChallengeId(null)}
      />
    </ProtectedRoute>
  );
}
