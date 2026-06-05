import { Medal, Swords } from "lucide-react";
import type { LeaderboardEntry } from "@/types/challenge";
import { LeaderboardRow } from "./LeaderboardRow";
import { GlassCard } from "@/components/ui/glass-card";

export function ChallengeLeaderboard({
  entries,
  isDuel,
}: {
  entries: LeaderboardEntry[];
  isDuel?: boolean;
}) {
  return (
    <GlassCard variant="elevated" className="p-4 sm:p-5">
      <h2 className="mb-4 font-display text-base font-bold text-[var(--text-primary)]">
        {isDuel ? (
          <>
            <Swords className="mr-1.5 inline size-4 text-brand-coral" /> Head to Head
          </>
        ) : (
          <>
            <Medal className="mr-1.5 inline size-4 text-brand-amber" /> Leaderboard
          </>
        )}
      </h2>
      {!entries.length ? (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">No participants yet</p>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => (
            <LeaderboardRow key={entry.userId} entry={entry} />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
