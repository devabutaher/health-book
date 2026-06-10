import { Flame } from "lucide-react";

export function DailyStreakTracker({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 shadow-[var(--shadow-card)]">
      <Flame
        className={`size-5 ${streak > 0 ? "text-brand-amber" : "text-[var(--text-muted)]"}`}
      />
      <span className="text-sm font-bold text-[var(--text-primary)]">
        {streak > 0 ? `${streak}-day streak!` : "No streak yet"}
      </span>
    </div>
  );
}
