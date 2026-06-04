import { cn } from "@/lib/utils";

export function OnlineStatus({ online, className }: { online: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border-2 border-[var(--bg-elevated)]",
        online ? "size-2.5 bg-green-500" : "size-2 bg-[var(--border-default)]",
        className,
      )}
    />
  );
}
