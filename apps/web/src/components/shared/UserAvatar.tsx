"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Ring = "default" | "premium" | "story";

interface UserAvatarProps {
  name?: string | null;
  username?: string | null;
  avatar?: string | null;
  size?: "default" | "sm" | "lg" | "xl";
  ring?: Ring;
  className?: string;
}

const sizeMap: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  default: "size-8",
  sm: "size-6",
  lg: "size-10",
  xl: "size-14",
};

function initials(name?: string | null) {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

function RingWrapper({
  ring,
  size,
  className,
  children,
}: {
  ring: Ring;
  size: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (ring === "default") {
    return (
      <div className={cn(size, "relative rounded-full ring-2 ring-[var(--bg-base)]", className)}>
        {children}
      </div>
    );
  }
  if (ring === "premium") {
    return (
      <div
        className={cn(
          size,
          "relative rounded-full p-[2px] bg-gradient-to-br from-brand-teal to-brand-green",
          className,
        )}
      >
        <div className="size-full rounded-full bg-background p-[2px]">{children}</div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        size,
        "relative rounded-full p-[2px] bg-gradient-to-br from-brand-blue via-brand-teal to-brand-green animate-spin-slow",
        className,
      )}
    >
      <div className="size-full rounded-full bg-background p-[2px]">{children}</div>
    </div>
  );
}

export function UserAvatar({
  name,
  avatar,
  size = "default",
  ring = "default",
  className,
}: UserAvatarProps) {
  const dim = sizeMap[size];
  return (
    <RingWrapper ring={ring} size={dim} className={className}>
      <Avatar
        size={size === "sm" ? "sm" : size === "xl" ? "lg" : "default"}
        className={cn("size-full", size === "xl" && "text-base")}
      >
        {avatar ? <AvatarImage src={avatar} alt={name ?? ""} /> : null}
        <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green font-semibold text-white">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
    </RingWrapper>
  );
}
