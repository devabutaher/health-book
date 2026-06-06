"use client";

import { CreatePostModal } from "@/components/post/CreatePostModal";
import { DraftsDialog } from "@/components/post/DraftsDialog";
import { BackgroundOrbs } from "@/components/shared/BackgroundOrbs";
import BottomNav from "@/components/shared/BottomNav";
import LeftSidebar from "@/components/shared/LeftSidebar";
import { PageTransition } from "@/components/shared/PageTransition";
import RefreshFAB from "@/components/shared/RefreshFAB";
import RightSidebar from "@/components/shared/RightSidebar";
import TopHeader from "@/components/shared/TopHeader";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useState } from "react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  useUnreadCount();
  const [createOpen, setCreateOpen] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(false);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background overflow-x-hidden">
      <BackgroundOrbs />
      <TopHeader />
      <LeftSidebar
        onCreatePost={() => setCreateOpen(true)}
        onOpenDrafts={() => setDraftsOpen(true)}
      />
      <RightSidebar />
      <main className="flex-1 overflow-y-auto pt-[calc(3.5rem+0.5rem)] md:pt-[calc(3.5rem+1.5rem)] md:pl-60 xl:pr-96">
        <PageTransition>
          <div className="mx-auto max-w-6xl px-4 pb-24 sm:pb-28 lg:pb-12">{children}</div>
        </PageTransition>
      </main>
      <BottomNav onCreatePost={() => setCreateOpen(true)} />
      <RefreshFAB />
      <CreatePostModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <DraftsDialog open={draftsOpen} onClose={() => setDraftsOpen(false)} />
    </div>
  );
}
