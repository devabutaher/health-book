"use client";

import { CreatePostModal } from "@/components/post/CreatePostModal";
import { DraftsDialog } from "@/components/post/DraftsDialog";
import { BackgroundOrbs } from "@/components/shared/BackgroundOrbs";
import BottomNav from "@/components/shared/BottomNav";
import LeftSidebar from "@/components/shared/LeftSidebar";
import { PageTransition } from "@/components/shared/PageTransition";
import { PullToRefresh } from "@/components/shared/PullToRefresh";
import RefreshFAB from "@/components/shared/RefreshFAB";
import RightSidebar from "@/components/shared/RightSidebar";
import TopHeader from "@/components/shared/TopHeader";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { resetApiCache } from "@/redux/store";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  useUnreadCount();
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(false);

  const disablePullToRefresh = pathname.startsWith("/reels") || pathname.startsWith("/stories");

  const handleRefresh = useCallback(async () => {
    resetApiCache();
  }, []);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background">
      <BackgroundOrbs />
      <TopHeader />
      <LeftSidebar
        onCreatePost={() => setCreateOpen(true)}
        onOpenDrafts={() => setDraftsOpen(true)}
      />
      <RightSidebar />
      <main className="flex-1 overflow-y-auto pt-2 lg:pt-4 lg:pl-60 xl:pr-96">
        <PullToRefresh onRefresh={handleRefresh} disabled={disablePullToRefresh}>
          <PageTransition>
            <div className="mx-auto max-w-6xl pb-4 px-4 sm:pb-8 lg:pb-12">{children}</div>
          </PageTransition>
        </PullToRefresh>
      </main>
      <BottomNav onCreatePost={() => setCreateOpen(true)} />
      <RefreshFAB />
      <CreatePostModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <DraftsDialog open={draftsOpen} onClose={() => setDraftsOpen(false)} />
    </div>
  );
}
