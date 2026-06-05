"use client";

import { ActiveNow } from "./ActiveNow";
import { SuggestedSection } from "./SuggestedSection";

export function MobilePeoplePanel() {
  return (
    <div className="xl:hidden mb-4 sm:mb-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] py-3">
      <div className="pb-2">
        <ActiveNow />
      </div>
      <div className="mx-3 my-2 h-px bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent" />
      <div className="pt-1">
        <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          Suggested
        </p>
        <SuggestedSection />
      </div>
    </div>
  );
}
