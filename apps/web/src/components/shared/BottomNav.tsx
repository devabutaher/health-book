"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Activity,
  Bell,
  Bookmark,
  BookOpen,
  Compass,
  FileText,
  Grid3x3,
  Home,
  Image,
  MessageCircle,
  Plus,
  Settings,
  Trophy,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/hooks";
import { useGetDraftsQuery } from "@/redux/api/postApi";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DraftsDialog } from "@/components/post/DraftsDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const primaryItems = [
  { href: "/feed", icon: Home },
  { href: "/explore", icon: Compass },
  { href: "/reels", icon: Video },
] as const;

const primaryRightItems = [
  { href: "/my-book", icon: BookOpen },
  { href: "/messages", icon: MessageCircle },
] as const;

export default function BottomNav({ onCreatePost }: { onCreatePost?: () => void }) {
  const pathname = usePathname();
  const user = useAppSelector((s) => s.auth.user);
  const { data: draftsData } = useGetDraftsQuery();
  const draftCount = Array.isArray(draftsData)
    ? draftsData.length
    : ((draftsData as { data?: unknown[] } | undefined)?.data?.length ?? 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const handleCreatePointerDown = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setQuickActionsOpen(true);
    }, 400);
  };

  const handleCreatePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!isLongPress.current && onCreatePost) {
      onCreatePost();
    }
  };

  const handleCreatePointerLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 md:hidden",
          "bg-[var(--glass-bg)] backdrop-blur-2xl",
          "border-t border-[var(--glass-border)]",
          "pb-safe",
        )}
      >
        <div className="flex items-center justify-around px-1 pt-2">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center rounded-2xl p-2.5 transition-all duration-200 active:scale-90",
                  active
                    ? "bg-gradient-to-r from-brand-teal/20 to-brand-green/20 border border-brand-teal/20"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-5", active ? "text-brand-teal" : "")} />
              </Link>
            );
          })}

          <button
            onPointerDown={handleCreatePointerDown}
            onPointerUp={handleCreatePointerUp}
            onPointerLeave={handleCreatePointerLeave}
            aria-label="Create post"
            className="relative -mt-6 flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-teal to-brand-green text-white shadow-[var(--shadow-glow-teal)] transition-transform active:scale-90"
          >
            <Plus className="size-6" />
          </button>

          {primaryRightItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center rounded-2xl p-2.5 transition-all duration-200 active:scale-90",
                  active
                    ? "bg-gradient-to-r from-brand-teal/20 to-brand-green/20 border border-brand-teal/20"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-5", active ? "text-brand-teal" : "")} />
              </Link>
            );
          })}

          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Menu"
            className={cn(
              "flex items-center justify-center rounded-2xl p-2.5 transition-all duration-200 active:scale-90",
              menuOpen
                ? "bg-gradient-to-r from-brand-teal/20 to-brand-green/20 border border-brand-teal/20"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Grid3x3 className="size-5" />
          </button>
        </div>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader>
            <SheetTitle className="font-display text-center">More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-4 px-4 pt-4">
            <MenuItem
              href="/groups"
              icon={Users}
              label="Groups"
              onClick={() => setMenuOpen(false)}
            />
            <MenuItem
              href="/challenges"
              icon={Trophy}
              label="Challenges"
              onClick={() => setMenuOpen(false)}
            />
            <MenuItem
              href="/stories"
              icon={Image}
              label="Stories"
              onClick={() => setMenuOpen(false)}
            />
            <MenuItem
              href="/notifications"
              icon={Bell}
              label="Alerts"
              onClick={() => setMenuOpen(false)}
              badge="•"
            />
            <MenuItem
              href="/saved"
              icon={Bookmark}
              label="Saved"
              onClick={() => setMenuOpen(false)}
            />
            <MenuItem
              href="/settings"
              icon={Settings}
              label="Settings"
              onClick={() => setMenuOpen(false)}
            />
            <MenuItem
              href={`/${user?.username || ""}`}
              icon={({ className }) => (
                <Avatar size="default" className={cn("size-6", className)}>
                  {user?.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
                  <AvatarFallback className="text-[9px] bg-gradient-to-br from-brand-teal to-brand-green text-white font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              )}
              label="Profile"
              onClick={() => setMenuOpen(false)}
            />
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setDraftsOpen(true);
              }}
              className="group relative flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-all duration-200 hover:bg-[var(--bg-overlay)] active:scale-90"
            >
              <span className="relative">
                <FileText className="size-6 text-muted-foreground group-hover:text-foreground" />
                {draftCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-brand-teal text-[9px] font-bold text-white">
                    {draftCount}
                  </span>
                )}
              </span>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                Drafts
              </span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <DraftsDialog open={draftsOpen} onClose={() => setDraftsOpen(false)} />

      <Sheet open={quickActionsOpen} onOpenChange={setQuickActionsOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader>
            <SheetTitle className="font-display text-center">Quick Create</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-2 px-4 pt-4">
            <QuickActionButton
              icon={Plus}
              label="New Post"
              onClick={() => {
                setQuickActionsOpen(false);
                setTimeout(() => onCreatePost?.(), 200);
              }}
            />
            <QuickActionButton
              icon={Image}
              label="New Story"
              href="/stories"
              onClick={() => setQuickActionsOpen(false)}
            />
            <QuickActionButton
              icon={Activity}
              label="Log Health"
              href="/my-book"
              onClick={() => setQuickActionsOpen(false)}
            />
            <QuickActionButton
              icon={Video}
              label="New Reel"
              href="/reels"
              onClick={() => setQuickActionsOpen(false)}
            />
            <QuickActionButton
              icon={Users}
              label="Create Group"
              href="/groups"
              onClick={() => setQuickActionsOpen(false)}
            />
            <QuickActionButton
              icon={Trophy}
              label="Create Challenge"
              href="/challenges"
              onClick={() => setQuickActionsOpen(false)}
            />
            <QuickActionButton
              icon={FileText}
              label="Drafts"
              onClick={() => {
                setQuickActionsOpen(false);
                setDraftsOpen(true);
              }}
              badge={draftCount > 0 ? String(draftCount) : undefined}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function MenuItem({
  href,
  icon: Icon,
  label,
  onClick,
  badge,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group relative flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-all duration-200 hover:bg-[var(--bg-overlay)] active:scale-90"
    >
      <span className="relative">
        <Icon className="size-6 text-muted-foreground group-hover:text-foreground" />
        {badge && <span className="absolute -right-1 -top-1 size-2 rounded-full bg-brand-coral" />}
      </span>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
        {label}
      </span>
    </Link>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  href,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  href?: string;
  badge?: string;
}) {
  const content = (
    <div className="group relative flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 transition-all duration-200 hover:bg-[var(--bg-overlay)] active:scale-90 min-h-[76px] w-full">
      <span className="relative flex items-center justify-center">
        <Icon className="size-6 text-muted-foreground group-hover:text-foreground" />
        {badge && (
          <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-brand-teal text-[9px] font-bold text-white">
            {badge}
          </span>
        )}
      </span>
      <span className="text-center text-xs font-medium text-muted-foreground group-hover:text-foreground leading-tight">
        {label}
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick}>
      {content}
    </button>
  );
}
