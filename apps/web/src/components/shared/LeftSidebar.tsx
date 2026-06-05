"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bookmark,
  BookOpen,
  Compass,
  FileText,
  Home,
  Image,
  MessageCircle,
  Plus,
  Settings as SettingsIcon,
  Trophy,
  Users,
  Video,
} from "lucide-react";
import { useAppSelector } from "@/hooks";
import { useGetDraftsQuery } from "@/redux/api/postApi";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const sections: {
  label: string;
  links: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}[] = [
  {
    label: "Social",
    links: [
      { href: "/feed", label: "Home", icon: Home },
      { href: "/explore", label: "Explore", icon: Compass },
      { href: "/messages", label: "Messages", icon: MessageCircle },
      { href: "/groups", label: "Groups", icon: Users },
    ],
  },
  {
    label: "Health",
    links: [
      { href: "/my-book", label: "My Book", icon: BookOpen },
      { href: "/challenges", label: "Challenges", icon: Trophy },
    ],
  },
  {
    label: "Media",
    links: [
      { href: "/reels", label: "Reels", icon: Video },
      { href: "/stories", label: "Stories", icon: Image },
    ],
  },
  {
    label: "Personal",
    links: [
      { href: "/saved", label: "Saved", icon: Bookmark },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

export default function LeftSidebar({
  onCreatePost,
  onOpenDrafts,
}: {
  onCreatePost?: () => void;
  onOpenDrafts?: () => void;
}) {
  const pathname = usePathname();
  const user = useAppSelector((s) => s.auth.user);
  const { data: draftsData } = useGetDraftsQuery();
  const draftCount = Array.isArray(draftsData)
    ? draftsData.length
    : ((draftsData as { data?: unknown[] } | undefined)?.data?.length ?? 0);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={cn(
        "hidden md:flex fixed left-0 top-14 bottom-0 w-60 flex-col",
        "bg-[var(--glass-bg)] backdrop-blur-md md:backdrop-blur-2xl",
        "border-r border-[var(--glass-border)]",
        "p-4",
      )}
    >
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-none">
        {sections.map((section, si) => (
          <div key={section.label}>
            {si > 0 && (
              <div className="mx-3 my-2 h-px bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent" />
            )}
            <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              {section.label}
            </p>
            {section.links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-brand-teal/20 to-brand-green/20 text-foreground border border-brand-teal/20"
                      : "text-muted-foreground hover:bg-[var(--bg-overlay)] hover:text-foreground",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-4 w-1 -translate-x-2 -translate-y-1/2 rounded-full bg-gradient-to-b from-brand-teal to-brand-green shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                  )}
                  <Icon
                    className={cn(
                      "size-5 transition-transform",
                      active
                        ? "text-brand-teal"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span className="flex-1">{link.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
        <div className="mx-3 my-2 h-px bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent" />
        <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          Quick
        </p>
        <button
          type="button"
          onClick={onOpenDrafts}
          className="group relative flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition-all duration-200 text-muted-foreground hover:bg-[var(--bg-overlay)] hover:text-foreground text-left"
        >
          <FileText className="size-5 text-muted-foreground group-hover:text-foreground" />
          <span className="flex-1">Drafts</span>
          {draftCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-brand-teal text-[10px] font-bold text-white">
              {draftCount}
            </span>
          )}
        </button>
      </nav>

      {onCreatePost && (
        <Button
          variant="gradient"
          size="lg"
          onClick={onCreatePost}
          className="mt-3 w-full font-display"
        >
          <Plus />
          Create Post
        </Button>
      )}

      <Link
        href={`/${user?.username || ""}`}
        prefetch={false}
        className="mt-2 flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-overlay)] px-3 py-2.5 text-sm transition-colors hover:bg-[var(--bg-subtle)]"
      >
        <div className="relative">
          <Avatar size="default" className="size-9">
            {user?.avatar ? <AvatarImage src={user.avatar} alt={user.name ?? ""} /> : null}
            <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-white font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[var(--bg-subtle)] bg-brand-green" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{user?.name}</p>
          <p className="truncate text-xs text-muted-foreground">@{user?.username}</p>
        </div>
      </Link>
    </aside>
  );
}
