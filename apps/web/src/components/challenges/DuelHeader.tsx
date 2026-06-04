"use client";

import { Swords, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetDuelQuery } from "@/redux/api/challengesApi";
import { useAppSelector } from "@/hooks";
import { cn } from "@/lib/utils";

export function DuelHeader({ challengeId }: { challengeId: string }) {
  const { data: duel, isLoading } = useGetDuelQuery(challengeId, { skip: !challengeId });
  const currentUserId = useAppSelector((s) => s.auth.user?.id);

  if (isLoading || !duel) return null;

  const me = duel.participants.find((p) => p.userId === currentUserId);
  const opponent = duel.participants.find((p) => p.userId !== currentUserId);
  const winnerId = duel.winner?.userId;
  const myScore = me?.score ?? 0;
  const oppScore = opponent?.score ?? 0;
  const myCompleted = me?.completed ?? false;
  const oppCompleted = opponent?.completed ?? false;

  return (
    <div className="rounded-2xl border border-brand-coral/20 bg-gradient-to-br from-brand-coral/[0.07] to-brand-pink/[0.05] p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-center gap-2">
        <Swords className="size-5 text-brand-coral" />
        <span className="font-display text-base font-bold text-[var(--text-primary)]">
          Head to Head
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* My side */}
        <div className="flex flex-1 flex-col items-center gap-2">
          <Avatar
            size="lg"
            className={cn(
              "size-14 ring-2",
              myCompleted ? "ring-brand-teal" : "ring-brand-coral/30",
            )}
          >
            {me?.user.avatar ? <AvatarImage src={me.user.avatar} alt={me.user.name} /> : null}
            <AvatarFallback className="bg-gradient-to-br from-brand-coral to-brand-pink text-base text-white">
              {me?.user.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-bold text-[var(--text-primary)] text-center truncate max-w-[120px]">
            {me?.user.name || "You"}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-extrabold text-brand-teal">{myScore}</span>
            {myCompleted && <Trophy className="size-4 text-brand-teal" />}
          </div>
          {myCompleted && (
            <span className="rounded-full bg-brand-teal/10 px-2 py-0.5 text-[10px] font-semibold text-brand-teal">
              ✓ Done
            </span>
          )}
        </div>

        {/* VS */}
        <div className="flex flex-col items-center gap-1">
          <span className="rounded-full bg-brand-coral/20 px-3 py-1 text-xs font-extrabold text-brand-coral">
            VS
          </span>
          {winnerId && (
            <span className="text-[10px] font-semibold text-brand-amber">
              {winnerId === currentUserId ? "You win!" : `${opponent?.user.name} wins`}
            </span>
          )}
        </div>

        {/* Opponent side */}
        <div className="flex flex-1 flex-col items-center gap-2">
          {opponent ? (
            <>
              <Avatar
                size="lg"
                className={cn(
                  "size-14 ring-2",
                  oppCompleted ? "ring-brand-teal" : "ring-brand-coral/30",
                )}
              >
                {opponent.user.avatar ? (
                  <AvatarImage src={opponent.user.avatar} alt={opponent.user.name} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-brand-blue to-brand-cyan text-base text-white">
                  {opponent.user.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-bold text-[var(--text-primary)] text-center truncate max-w-[120px]">
                {opponent.user.name}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-extrabold text-brand-blue">{oppScore}</span>
                {oppCompleted && <Trophy className="size-4 text-brand-blue" />}
              </div>
              {oppCompleted && (
                <span className="rounded-full bg-brand-teal/10 px-2 py-0.5 text-[10px] font-semibold text-brand-teal">
                  ✓ Done
                </span>
              )}
            </>
          ) : (
            <div className="flex size-14 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[10px] text-[var(--text-muted)]">
              Waiting...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
