"use client";

import { motion } from "framer-motion";

export type GroupTab = "feed" | "events" | "polls" | "members" | "challenges" | "about";

interface GroupTabsProps {
  active: GroupTab;
  onChange: (tab: GroupTab) => void;
  isMember: boolean;
}

const tabs = [
  { id: "feed" as const, label: "Feed", memberOnly: false },
  { id: "events" as const, label: "Events", memberOnly: true },
  { id: "polls" as const, label: "Polls", memberOnly: true },
  { id: "challenges" as const, label: "Challenges", memberOnly: true },
  { id: "members" as const, label: "Members", memberOnly: false },
  { id: "about" as const, label: "About", memberOnly: false },
];

export function GroupTabs({ active, onChange, isMember }: GroupTabsProps) {
  return (
    <div className="flex overflow-x-auto border-b border-[var(--border-default)] scrollbar-none">
      {tabs
        .filter((t) => !t.memberOnly || isMember)
        .map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex shrink-0 items-center justify-center whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors"
          >
            {active === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-teal"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span
              className={
                active === tab.id
                  ? "text-brand-teal"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }
            >
              {tab.label}
            </span>
          </button>
        ))}
    </div>
  );
}
