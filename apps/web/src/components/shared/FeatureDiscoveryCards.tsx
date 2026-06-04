"use client";

import Link from "next/link";
import { Trophy, Users, BookOpen, Video, Compass, ArrowRight } from "lucide-react";

interface Feature {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  gradient: string;
}

const FEATURES: Feature[] = [
  {
    label: "Challenges",
    description: "Join health challenges",
    href: "/challenges",
    icon: <Trophy className="size-5" />,
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  {
    label: "Groups",
    description: "Find your community",
    href: "/groups",
    icon: <Users className="size-5" />,
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    label: "Log Health",
    description: "Track your wellness",
    href: "/my-book",
    icon: <BookOpen className="size-5" />,
    gradient: "from-teal-500/20 to-green-500/20",
  },
  {
    label: "Reels",
    description: "Short health tips",
    href: "/reels",
    icon: <Video className="size-5" />,
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    label: "Explore",
    description: "Discover content",
    href: "/explore",
    icon: <Compass className="size-5" />,
    gradient: "from-coral-500/20 to-red-500/20",
  },
];

export function FeatureDiscoveryCards() {
  return (
    <div
      className="mb-6 flex gap-3 overflow-x-auto scrollbar-none sm:grid sm:grid-cols-5 sm:gap-3"
      style={{
        maskImage: "linear-gradient(to right, black 90%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, black 90%, transparent)",
      }}
    >
      {FEATURES.map((feature) => (
        <Link
          key={feature.href}
          href={feature.href}
          className="group relative h-full shrink-0 w-28 rounded-2xl p-[1px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02]" />
          <div className="relative flex min-h-[100px] flex-col items-center gap-1.5 rounded-[calc(1rem-1px)] bg-[var(--bg-elevated)] px-2 py-3 sm:px-3 sm:py-4">
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-foreground transition-transform duration-300 group-hover:scale-110`}
            >
              {feature.icon}
            </div>
            <span className="text-center text-[10px] font-semibold leading-tight sm:text-xs">
              {feature.label}
            </span>
            <ArrowRight className="mt-auto size-3 shrink-0 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100" />
          </div>
        </Link>
      ))}
    </div>
  );
}
