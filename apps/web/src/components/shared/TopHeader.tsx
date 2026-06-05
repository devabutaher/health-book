"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { isOnline, subscribeOnline } from "@/lib/onlineStore";
import { cn } from "@/lib/utils";
import { useLogoutMutation } from "@/redux/api/authApi";
import { useGetHealthStatsQuery } from "@/redux/api/healthLogApi";
import { logout } from "@/redux/slices/authSlice";
import { Activity, BookOpen, Flame, LogOut, Trophy, User as UserIcon, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import MessagesBell from "../messaging/MessagesBell";
import NotificationBell from "../notifications/NotificationBell";
import MobileSearch from "./MobileSearch";
import RefreshButton from "./RefreshButton";
import SearchBar from "./SearchBar";
import { ThemeToggle } from "./ThemeToggle";

const pageNames: Record<string, string> = {
  "/feed": "Home",
  "/explore": "Explore",
  "/messages": "Messages",
  "/groups": "Groups",
  "/my-book": "My Book",
  "/challenges": "Challenges",
  "/reels": "Reels",
  "/stories": "Stories",
  "/saved": "Saved",
  "/notifications": "Notifications",
  "/settings": "Settings",
};

export default function TopHeader() {
  const pathname = usePathname();
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [doLogout] = useLogoutMutation();
  const { data: healthStats } = useGetHealthStatsQuery(undefined);
  const stats = healthStats as { streak?: number; healthScore?: number } | undefined;
  const streak = stats?.streak ?? 0;
  const healthScore = stats?.healthScore ?? 0;

  const currentPage = Object.entries(pageNames).find(
    ([path]) => pathname === path || pathname.startsWith(path + "/"),
  )?.[1];

  const myUserId = useAppSelector((s) => s.auth.user?.id);
  const online = useSyncExternalStore(
    subscribeOnline,
    () => (myUserId ? isOnline(myUserId) : false),
    () => false,
  );

  const handleLogout = async () => {
    try {
      await doLogout(undefined).unwrap();
    } catch {
      // still clear local state even if server call fails
    }
    dispatch(logout());
    router.push("/login");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full",
        "bg-[var(--glass-bg)] backdrop-blur-md md:backdrop-blur-2xl",
        "border-b border-[var(--glass-border)]",
        "sm:pt-safe",
      )}
    >
      <div className="relative flex h-14 items-center">
        <div className="flex flex-shrink-0 items-center pl-4 lg:w-60">
          <Link href="/feed" className="flex items-center gap-3">
            <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-teal to-brand-green shadow-lg shadow-brand-teal/20">
              <BookOpen className="size-5 text-white" />
            </div>
            <span className="hidden sm:inline font-display text-lg sm:text-xl font-extrabold tracking-tight text-gradient-primary">
              HealthBook
            </span>
          </Link>
        </div>

        <div className="h-6 w-px bg-gradient-to-b from-brand-teal to-brand-green hidden xl:block" />

        <div className="flex-1 min-w-0 relative hidden lg:flex items-center h-full">
          <div className="hidden 2xl:flex items-center gap-3 shrink-0 pl-2">
            <div className="flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--bg-overlay)] px-2.5 py-1">
              <Flame className="size-3.5 text-brand-amber" />
              <span className="text-xs font-semibold text-foreground">{streak}</span>
              <span className="mx-1 size-1 rounded-full bg-[var(--border-default)]" />
              <Activity className="size-3.5 text-brand-teal" />
              <span className="text-xs font-semibold text-brand-teal">{healthScore}%</span>
            </div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-md">
            <SearchBar />
          </div>
        </div>

        <div className="ml-auto flex items-center pr-4 xl:w-96 shrink-0">
          <div className="hidden xl:block h-6 w-px bg-gradient-to-b from-brand-teal to-brand-green" />
          <div className="flex flex-1 items-center xl:justify-between justify-end gap-1 pl-2">
            <MobileSearch />

            <Link
              href="/my-book"
              prefetch={false}
              aria-label="My Book"
              className="hidden sm:flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-[var(--bg-overlay)] hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40"
            >
              <BookOpen className="size-5" />
            </Link>
            <Link
              href="/groups"
              prefetch={false}
              aria-label="Groups"
              className="hidden sm:flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-[var(--bg-overlay)] hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40"
            >
              <Users className="size-5" />
            </Link>
            <Link
              href="/challenges"
              prefetch={false}
              aria-label="Challenges"
              className="hidden sm:flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-[var(--bg-overlay)] hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40"
            >
              <Trophy className="size-5" />
            </Link>

            <MessagesBell />
            <NotificationBell />
            <span className="md:hidden">
              <RefreshButton />
            </span>

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Open profile menu"
                  className="ml-1 flex size-9 items-center justify-center rounded-full transition-all hover:ring-2 hover:ring-[var(--border-strong)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40"
                >
                  <div className="relative">
                    <Avatar size="default" className="size-9">
                      {user?.avatar ? (
                        <AvatarImage src={user.avatar} alt={user.name ?? ""} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-white font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    {online && (
                      <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[var(--bg-elevated)] bg-green-500" />
                    )}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-56">
                <div className="flex items-center gap-3 p-2">
                  <Avatar size="lg" className="size-10">
                    {user?.avatar ? <AvatarImage src={user.avatar} alt={user.name ?? ""} /> : null}
                    <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-white font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{user?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">@{user?.username}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${user?.username || ""}`}
                    prefetch={false}
                    className="cursor-pointer"
                  >
                    <UserIcon />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="text-destructive" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
