"use client";

import { ReelActions } from "@/components/reels/ReelActions";
import { ReelComments } from "@/components/reels/ReelComments";
import { ReelPlayer } from "@/components/reels/ReelPlayer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppSelector } from "@/hooks";
import { useGetReelQuery } from "@/redux/api/reelsApi";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReelDetail({ id: reelId }: { id: string }) {
  const router = useRouter();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const {
    data: reel,
    isLoading,
    isError,
  } = useGetReelQuery(reelId, { refetchOnMountOrArgChange: true });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100dvh-11rem)] lg:h-[calc(100dvh-8rem)] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (isError || !reel) {
    return (
      <div className="flex h-[calc(100dvh-11rem)] lg:h-[calc(100dvh-8rem)] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Reel not found</p>
        <Link href="/reels" className="text-brand-teal underline">
          Back to reels
        </Link>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100dvh-11rem)] lg:h-[calc(100dvh-8rem)]">
      <button
        onClick={() => router.back()}
        className="absolute left-4 top-4 z-20 flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white/80 hover:text-white transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="size-6" />
      </button>

      <div className="flex h-full items-center justify-center">
        <div className="relative h-full w-full max-w-md">
          <div className="relative mx-auto h-full w-full overflow-hidden bg-black">
            <ReelPlayer videoUrl={reel.videoUrl} />

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 pt-12">
              <div className="flex items-center gap-2">
                <Link href={`/${reel.user.username}`} prefetch={false}>
                  <Avatar size="sm" className="size-8 ring-2 ring-white/30 cursor-pointer">
                    {reel.user.avatar ? (
                      <AvatarImage src={reel.user.avatar} alt={reel.user.name} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-xs text-white">
                      {reel.user.name?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <Link
                  href={`/${reel.user.username}`}
                  prefetch={false}
                  className="text-sm font-semibold text-white hover:underline"
                >
                  {reel.user.name}
                </Link>
              </div>
              {reel.caption && (
                <p className="mt-1.5 line-clamp-2 text-xs text-white/80">{reel.caption}</p>
              )}
            </div>

            <ReelActions
              reelId={reel.id}
              currentCaption={reel.caption}
              initialLiked={reel.isLiked}
              initialLikesCount={reel.likesCount}
              commentsCount={reel.commentsCount}
              isOwner={currentUserId === reel.user.id}
              onCommentClick={() => setCommentsOpen(!commentsOpen)}
            />
          </div>

          {commentsOpen && (
            <ReelComments reelId={reel.id} open={true} onClose={() => setCommentsOpen(false)} />
          )}
        </div>
      </div>
    </div>
  );
}
