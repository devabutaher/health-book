import { Flame } from "lucide-react";

export function DailyStreakTracker({ streak }: { streak: number }) {
  const days = Array.from({ length: 7 }, (_, i) => i < streak);

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center gap-2">
        <Flame
          className={`size-5 ${streak > 0 ? "text-brand-amber" : "text-[var(--text-muted)]"}`}
        />
        <span className="text-sm font-bold text-[var(--text-primary)]">
          {streak > 0 ? `${streak}-day streak!` : "No streak yet"}
        </span>
      </div>
      <div className="flex gap-1.5">
        {days.map((active, i) => (
          <div
            key={i}
            className={`flex-1 rounded-lg py-1.5 text-center text-[10px] font-semibold transition-all ${
              active
                ? "bg-gradient-to-b from-brand-amber to-brand-coral text-white shadow-[var(--shadow-glow-amber)]"
                : "bg-[var(--bg-subtle)] text-[var(--text-muted)]"
            }`}
          >
            {["M", "T", "W", "T", "F", "S", "S"][i]}
          </div>
        ))}
      </div>
    </div>
  );
}
