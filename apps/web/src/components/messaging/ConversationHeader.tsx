"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useClearMessagesMutation,
  useDeleteConversationMutation,
  useGetConversationsQuery,
  useToggleMuteMutation,
  useUpdateGroupInfoMutation,
} from "@/redux/api/messagingApi";
import {
  Bell,
  BellOff,
  ChevronLeft,
  Edit3,
  Eraser,
  Link,
  Menu,
  MoreVertical,
  Trash2,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AddParticipantModal } from "./AddParticipantModal";
import { GroupMembersSheet } from "./GroupMembersSheet";

export function ConversationHeader({
  conversationId,
  currentUserId,
  onBack,
  onToggleSidebar,
}: {
  conversationId: string;
  currentUserId?: string;
  onBack: () => void;
  onToggleSidebar?: () => void;
}) {
  const { data: conversations, isLoading } = useGetConversationsQuery();
  const [toggleMute] = useToggleMuteMutation();
  const [deleteConversation] = useDeleteConversationMutation();
  const [clearMessages] = useClearMessagesMutation();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"clear" | "delete" | "deleteGroup" | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [updateGroupInfo] = useUpdateGroupInfoMutation();
  const [editingName, setEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const conv = conversations?.find((c) => c.id === conversationId);
  const currentParticipant = conv?.participants.find((p) => p.userId === currentUserId);
  const isAdmin = currentParticipant?.role === "ADMIN";

  const otherParticipant =
    conv && !conv.isGroup ? conv.participants.find((p) => p.userId !== currentUserId) : null;

  const displayName = conv?.isGroup
    ? conv.groupName || "Group"
    : otherParticipant?.user.name || conv?.participants[0]?.user.name || "Chat";

  const avatar = conv?.isGroup ? conv.groupAvatar : otherParticipant?.user.avatar || conv?.participants[0]?.user.avatar;

  const initials = displayName.slice(0, 2).toUpperCase();

  const handleViewProfile = () => {
    if (otherParticipant) {
      router.push(`/${otherParticipant.user.username}`);
    }
    setMenuOpen(false);
  };

  const handleCopyProfileLink = () => {
    if (otherParticipant) {
      navigator.clipboard.writeText(`${window.location.origin}/${otherParticipant.user.username}`);
      toast.success("Profile link copied");
    }
    setMenuOpen(false);
  };

  const handleMute = async () => {
    try {
      await toggleMute(conversationId).unwrap();
      toast.success(conv?.isMuted ? "Unmuted" : "Muted");
    } catch {
      toast.error("Failed to toggle mute");
    }
    setMenuOpen(false);
  };

  const handleDeleteConversation = async (forEveryone?: boolean) => {
    setMenuOpen(false);
    setConfirmAction(null);
    try {
      await deleteConversation({ conversationId, forEveryone }).unwrap();
      toast.success(forEveryone ? "Group deleted" : conv?.isGroup ? "Left group" : "Conversation deleted");
      onBack();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data: { message?: string } }).data?.message
          : undefined;
      toast.error(msg || "Failed to delete conversation");
    }
  };

  const handleClearMessages = async () => {
    setMenuOpen(false);
    setConfirmAction(null);
    try {
      await clearMessages(conversationId).unwrap();
      toast.success("Messages cleared");
    } catch {
      toast.error("Failed to clear messages");
    }
  };

  return (
    <div className="relative flex items-center gap-3 border-b border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3">
      {isLoading ? (
        <div className="flex items-center gap-3 flex-1">
          <div className="size-9 animate-pulse rounded-full bg-[var(--bg-subtle)]" />
          <div className="h-4 w-32 animate-pulse rounded bg-[var(--bg-subtle)]" />
        </div>
      ) : (
        <>
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              aria-label="Open conversations"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-overlay)] hover:text-[var(--text-secondary)] lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          )}
          <button
            onClick={onBack}
            aria-label="Go back"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-overlay)] hover:text-[var(--text-secondary)] lg:hidden"
          >
            <ChevronLeft className="size-5" />
          </button>
          <Avatar size="default" className="size-9">
            {avatar ? <AvatarImage src={avatar} alt={displayName} /> : null}
            <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-green text-xs text-white">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {displayName}
            </p>
            {conv?.isGroup && conv.participants && (
              <p className="truncate text-[10px] text-[var(--text-muted)]">
                {conv.participants.length} members
              </p>
            )}
          </div>
        </>
      )}

      <button
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="More options"
        className="flex size-11 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-overlay)] hover:text-[var(--text-secondary)]"
      >
        <MoreVertical className="size-5" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-2 top-full z-50 mt-1 min-w-44 overflow-y-auto rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] max-h-80">
            {conv?.isGroup ? (
              <>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setMembersOpen(true);
                  }}
                    className="flex w-full items-center gap-2.5 px-3 py-3 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-overlay)]"
                  >
                    <Users className="size-4" /> Members
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setAddParticipantOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-3 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-overlay)]"
                  >
                    <UserPlus className="size-4" /> Add People
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setEditingName(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-3 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-overlay)]"
                    >
                      <Edit3 className="size-4" /> Edit Group Name
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={handleViewProfile}
                    className="flex w-full items-center gap-2.5 px-3 py-3 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-overlay)]"
                  >
                    <User className="size-4" /> View Profile
                  </button>
                  <button
                    onClick={handleCopyProfileLink}
                    className="flex w-full items-center gap-2.5 px-3 py-3 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-overlay)]"
                  >
                    <Link className="size-4" /> Copy Profile Link
                  </button>
                </>
              )}
              <button
                onClick={handleMute}
                className="flex w-full items-center gap-2.5 px-3 py-3 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-overlay)]"
              >
                {conv?.isMuted ? <Bell className="size-4" /> : <BellOff className="size-4" />}
                {conv?.isMuted ? "Unmute" : "Mute"}
              </button>
              <hr className="border-[var(--border-default)]" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmAction("clear");
                }}
                className="flex w-full items-center gap-2.5 px-3 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10"
              >
                <Eraser className="size-4" /> Clear Messages
              </button>
              {conv?.isGroup && isAdmin && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmAction("deleteGroup");
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 className="size-4" /> Delete Group
                </button>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmAction("delete");
                }}
                className="flex w-full items-center gap-2.5 px-3 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="size-4" /> {conv?.isGroup ? "Leave Group" : "Delete Conversation"}
              </button>
          </div>

          {conv && (
            <GroupMembersSheet
              open={membersOpen}
              onClose={() => setMembersOpen(false)}
              conversation={conv}
              currentUserId={currentUserId}
            />
          )}

          {conv && (
            <AddParticipantModal
              open={addParticipantOpen}
              onClose={() => setAddParticipantOpen(false)}
              conversationId={conversationId}
              existingMemberIds={conv.participants.map((p) => p.userId)}
            />
          )}

          <AlertDialog open={editingName} onOpenChange={(open) => !open && setEditingName(false)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Edit Group Name</AlertDialogTitle>
              </AlertDialogHeader>
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setEditingName(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    if (newGroupName.trim() && newGroupName !== conv?.groupName) {
                      try {
                        await updateGroupInfo({
                          conversationId,
                          groupName: newGroupName.trim(),
                        }).unwrap();
                        toast.success("Group name updated");
                      } catch {
                        toast.error("Failed to update group name");
                      }
                    }
                    setEditingName(false);
                  }}
                >
                  Save
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      <AlertDialog
        open={confirmAction === "clear"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear messages?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all messages in this conversation for you. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleClearMessages}>
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmAction === "delete" || confirmAction === "deleteGroup"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "deleteGroup"
                ? "Delete group forever?"
                : conv?.isGroup
                  ? "Leave group?"
                  : "Delete conversation?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "deleteGroup"
                ? "This will permanently delete the group and all messages for everyone. This cannot be undone."
                : conv?.isGroup
                  ? "You will no longer be a member of this group. Other members can still see the conversation."
                  : "This will remove this conversation for you. Other participants won&apos;t be affected. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                handleDeleteConversation(confirmAction === "deleteGroup" ? true : undefined)
              }
            >
              {confirmAction === "deleteGroup" ? "Delete" : conv?.isGroup ? "Leave" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
