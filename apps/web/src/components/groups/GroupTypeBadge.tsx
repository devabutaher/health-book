import { Globe, Lock, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupType } from "@/types/group";

const config: Record<GroupType, { icon: typeof Globe; label: string; class: string }> = {
  PUBLIC: { icon: Globe, label: "Public", class: "bg-brand-teal/10 text-brand-teal" },
  PRIVATE: { icon: Lock, label: "Private", class: "bg-brand-amber/10 text-brand-amber" },
  SECRET: { icon: EyeOff, label: "Secret", class: "bg-brand-coral/10 text-brand-coral" },
};

export function GroupTypeBadge({ type, className }: { type: GroupType; className?: string }) {
  const c = config[type];
  const Icon = c.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold",
        c.class,
        className,
      )}
    >
      <Icon className="size-3" />
      {c.label}
    </span>
  );
}
