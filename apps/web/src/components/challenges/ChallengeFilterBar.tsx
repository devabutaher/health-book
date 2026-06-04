import { cn } from "@/lib/utils";

const typeFilters = [
  { value: undefined, label: "All" },
  { value: "SOLO", label: "Solo" },
  { value: "GROUP", label: "Group" },
  { value: "PLATFORM", label: "Platform" },
  { value: "DUEL", label: "Duel" },
] as const;

const difficultyFilters = [
  { value: undefined, label: "Any" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
] as const;

export function ChallengeFilterBar({
  activeType,
  activeDifficulty,
  onTypeChange,
  onDifficultyChange,
}: {
  activeType: string | undefined;
  activeDifficulty: string | undefined;
  onTypeChange: (value: string | undefined) => void;
  onDifficultyChange: (value: string | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {typeFilters.map((f) => (
          <button
            key={f.label}
            onClick={() => onTypeChange(f.value)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
              activeType === f.value
                ? "bg-gradient-to-r from-brand-teal to-brand-green text-white shadow-[var(--shadow-glow-teal)]"
                : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {difficultyFilters.map((f) => (
          <button
            key={f.label}
            onClick={() => onDifficultyChange(f.value)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all",
              activeDifficulty === f.value
                ? "bg-gradient-to-r from-brand-blue to-brand-cyan text-white"
                : "bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
