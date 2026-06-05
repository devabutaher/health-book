"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Users, FileText, Hash, SearchX, UsersRound, Trophy } from "lucide-react";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { PostCard } from "@/components/post/PostCard";
import {
  useSearchUsersQuery,
  useSearchPostsQuery,
  useSearchHashtagsQuery,
} from "@/redux/api/searchApi";
import { useSearchGroupsQuery } from "@/redux/api/groupsApi";
import { useSearchChallengesQuery } from "@/redux/api/challengesApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Post } from "@/types/post";
import type { Group } from "@/types/group";
import type { Challenge } from "@/types/challenge";

const RECENT_KEY = "recentSearches";
const MAX_RECENT = 8;

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function addRecent(q: string) {
  const list = getRecent().filter((s) => s !== q);
  list.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [tab, setTab] = useState("people");

  const { data: usersData, isLoading: usersLoading } = useSearchUsersQuery(q, { skip: !q });
  const { data: postsData, isLoading: postsLoading } = useSearchPostsQuery({ q }, { skip: !q });
  const { data: tagsData, isLoading: tagsLoading } = useSearchHashtagsQuery(q, { skip: !q });
  const { data: groupsData, isLoading: groupsLoading } = useSearchGroupsQuery({ q }, { skip: !q });
  const { data: challengesData, isLoading: challengesLoading } = useSearchChallengesQuery(
    { q },
    { skip: !q },
  );

  const users: Array<{
    id: string;
    name: string;
    username: string;
    avatar?: string | null;
    isVerified?: boolean;
  }> = usersData || [];
  const posts: Post[] = (postsData?.posts as Post[]) || [];
  const tags: Array<{ tag: string; count: number }> =
    (tagsData?.data as Array<{ tag: string; count: number }>) || [];
  const groups: Group[] = (groupsData as { groups: Group[] } | null)?.groups || [];
  const challenges: Challenge[] = challengesData?.challenges || [];

  const recentSearches = getRecent();

  if (q) {
    addRecent(q);
  }

  if (!q) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-[600px]">
          {recentSearches.length > 0 ? (
            <div>
              <h2 className="mb-3 font-display text-lg font-bold tracking-tight">
                Recent searches
              </h2>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s) => (
                  <Link
                    key={s}
                    href={`/search?q=${encodeURIComponent(s)}`}
                    prefetch={false}
                    className="rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1.5 text-sm transition-colors hover:border-brand-teal/30 hover:bg-[var(--bg-overlay)]"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Empty>
              <EmptyMedia variant="gradient"></EmptyMedia>
              <EmptyTitle>Search HealthBook</EmptyTitle>
              <EmptyDescription>
                Find people, posts, and hashtags from the search bar above.
              </EmptyDescription>
            </Empty>
          )}
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-[600px]">
        <h1 className="mb-4 sm:mb-6 font-display text-2xl font-extrabold tracking-tight">
          Results for &ldquo;{q}&rdquo;
        </h1>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="people" className="gap-1.5">
              <Users className="size-4" />
              People ({users.length})
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-1.5">
              <FileText className="size-4" />
              Posts ({posts.length})
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-1.5">
              <UsersRound className="size-4" />
              Groups ({groups.length})
            </TabsTrigger>
            <TabsTrigger value="challenges" className="gap-1.5">
              <Trophy className="size-4" />
              Challenges ({challenges.length})
            </TabsTrigger>
            <TabsTrigger value="hashtags" className="gap-1.5">
              <Hash className="size-4" />
              Tags ({tags.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="mt-4 flex flex-col gap-2">
            {usersLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3"
                  >
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length > 0 ? (
              users.map((u) => (
                <Link
                  key={u.id}
                  href={`/${u.username}`}
                  prefetch={false}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 transition-colors hover:border-brand-teal/30 hover:bg-[var(--bg-overlay)]"
                >
                  <UserAvatar
                    name={u.name}
                    avatar={u.avatar}
                    ring={u.isVerified ? "premium" : "default"}
                    size="lg"
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{u.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </div>
                </Link>
              ))
            ) : (
              <Empty>
                <EmptyMedia variant="gradient">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>No people found</EmptyTitle>
                <EmptyDescription>No users match &ldquo;{q}&rdquo;.</EmptyDescription>
              </Empty>
            )}
          </TabsContent>

          <TabsContent value="posts" className="mt-4 flex flex-col gap-4">
            {postsLoading ? (
              <div className="flex flex-col gap-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-48 rounded-2xl border bg-[var(--bg-elevated)] shimmer"
                  />
                ))}
              </div>
            ) : posts.length > 0 ? (
              posts.map((post: Post) => <PostCard key={post.id} post={post} />)
            ) : (
              <Empty>
                <EmptyMedia variant="gradient">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>No posts found</EmptyTitle>
                <EmptyDescription>No posts match &ldquo;{q}&rdquo;.</EmptyDescription>
              </Empty>
            )}
          </TabsContent>

          <TabsContent value="groups" className="mt-4 flex flex-col gap-2">
            {groupsLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3"
                  >
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : groups.length > 0 ? (
              groups.map((g) => (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  prefetch={false}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 transition-colors hover:border-brand-teal/30 hover:bg-[var(--bg-overlay)]"
                >
                  <Avatar className="size-10">
                    {g.avatar ? <AvatarImage src={g.avatar} alt={g.name} /> : null}
                    <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-sm text-white">
                      {g.name?.charAt(0)?.toUpperCase() || "G"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-semibold">{g.name}</span>
                      <Badge variant="outline" className="text-[10px] font-normal capitalize">
                        {g.type.toLowerCase()}
                      </Badge>
                    </div>
                    {g.description && (
                      <p className="truncate text-xs text-muted-foreground">{g.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{g.memberCount} members</p>
                  </div>
                </Link>
              ))
            ) : (
              <Empty>
                <EmptyMedia variant="gradient">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>No groups found</EmptyTitle>
                <EmptyDescription>No groups match &ldquo;{q}&rdquo;.</EmptyDescription>
              </Empty>
            )}
          </TabsContent>

          <TabsContent value="challenges" className="mt-4 flex flex-col gap-2">
            {challengesLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
            ) : challenges.length > 0 ? (
              challenges.map((c) => (
                <Link
                  key={c.id}
                  href={`/challenges/${c.id}`}
                  prefetch={false}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 transition-colors hover:border-brand-teal/30 hover:bg-[var(--bg-overlay)]"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-amber/15 to-brand-coral/15 text-brand-amber">
                    <Trophy className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-semibold">{c.title}</span>
                      <span className="shrink-0 rounded bg-[var(--bg-subtle)] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {c.type}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.category.replace("_", " ")} · {c.participantCount} participants ·{" "}
                      {c.dayCount} days
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <Empty>
                <EmptyMedia variant="gradient">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>No challenges found</EmptyTitle>
                <EmptyDescription>No challenges match &ldquo;{q}&rdquo;.</EmptyDescription>
              </Empty>
            )}
          </TabsContent>

          <TabsContent value="hashtags" className="mt-4 flex flex-col gap-2">
            {tagsLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 rounded-2xl" />
                ))}
              </div>
            ) : tags.length > 0 ? (
              tags.map((t: { tag: string; count: number }) => (
                <Link
                  key={t.tag}
                  href={`/hashtag/${encodeURIComponent(t.tag.replace("#", ""))}`}
                  prefetch={false}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 transition-colors hover:border-brand-teal/30 hover:bg-[var(--bg-overlay)]"
                >
                  <span className="font-medium text-brand-teal">{t.tag}</span>
                  <span className="text-xs text-muted-foreground">{t.count} posts</span>
                </Link>
              ))
            ) : (
              <Empty>
                <EmptyMedia variant="gradient">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>No hashtags found</EmptyTitle>
                <EmptyDescription>No hashtags match &ldquo;{q}&rdquo;.</EmptyDescription>
              </Empty>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
