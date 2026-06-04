"use client";

import { motion } from "framer-motion";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useSound } from "@/hooks/useSound";
import {
  useDeleteEventMutation,
  useGetGroupEventsQuery,
  useRsvpEventMutation,
} from "@/redux/api/groupEventApi";
import type { GroupEvent } from "@/types/groupEvent";
import { Calendar, MapPin, Plus, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CreateEventModal } from "./CreateEventModal";

const eventContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const eventItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

function EventCard({ event, canManage }: { event: GroupEvent; canManage: boolean }) {
  const [rsvp, { isLoading: isRsvping }] = useRsvpEventMutation();
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { play } = useSound();

  const dateStr = useMemo(() => {
    const d = new Date(event.date);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [event.date]);

  const isPast = useMemo(() => new Date(event.date) < new Date(), [event.date]);

  const handleRsvp = async (status: string) => {
    try {
      await rsvp({ eventId: event.id, groupId: event.groupId, status }).unwrap();
      play("success");
      toast.success(
        status === "GOING"
          ? "See you there!"
          : status === "MAYBE"
            ? "Marked as maybe"
            : "RSVP updated",
      );
    } catch {
      toast.error("Failed to RSVP");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEvent({ eventId: event.id, groupId: event.groupId }).unwrap();
      toast.success("Event deleted");
      setDeleteOpen(false);
    } catch {
      toast.error("Failed to delete event");
    }
  };

  return (
    <GlassCard variant="elevated" className={`p-4 ${isPast ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {event.title}
            </h3>
            {isPast && (
              <Badge variant="outline" className="shrink-0 text-[10px]">
                Past
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{dateStr}</p>
          {event.description && (
            <p className="mt-2 text-xs text-[var(--text-secondary)]">{event.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)]">
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {event.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              {event.rsvpCounts.GOING}
              {event.maxAttendees ? ` / ${event.maxAttendees}` : ""} going
            </span>
            {event.rsvpCounts.MAYBE > 0 && <span>{event.rsvpCounts.MAYBE} maybe</span>}
          </div>
        </div>

        {canManage && !isPast && (
          <button
            onClick={() => setDeleteOpen(true)}
            disabled={isDeleting}
            className="flex size-8 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-overlay)] hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      {!isPast && (
        <div className="mt-3 flex gap-2">
          {(["GOING", "MAYBE", "NOT_GOING"] as const).map((status) => {
            const isActive = event.myRsvp === status;
            return (
              <motion.button
                key={status}
                layout
                whileTap={{ scale: 0.92 }}
                animate={isActive ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => handleRsvp(status)}
                disabled={isRsvping}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  isActive
                    ? status === "GOING"
                      ? "bg-gradient-to-r from-brand-teal to-brand-green text-white"
                      : status === "MAYBE"
                        ? "bg-brand-amber/20 text-brand-amber"
                        : "bg-[var(--bg-subtle)] text-[var(--text-muted)] line-through"
                    : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]"
                }`}
              >
                {status === "GOING" ? "Going" : status === "MAYBE" ? "Maybe" : "Can't Go"}
              </motion.button>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GlassCard>
  );
}

export function GroupEventsSection({
  groupId,
  canManage,
}: {
  groupId: string;
  canManage: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: events, isLoading, isError } = useGetGroupEventsQuery(groupId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
        <div className="h-24 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
      </div>
    );
  }

  if (isError) {
    return (
      <GlassCard variant="subtle" className="flex flex-col items-center py-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">Failed to load events</p>
      </GlassCard>
    );
  }

  const upcoming = (events || []).filter((e) => new Date(e.date) >= new Date());
  const past = (events || []).filter((e) => new Date(e.date) < new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
          Events {events && events.length > 0 && `(${events.length})`}
        </h2>
        {canManage && (
          <Button size="sm" variant="gradient" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Create Event
          </Button>
        )}
      </div>

      {!events || events.length === 0 ? (
        <GlassCard variant="subtle" className="flex flex-col items-center py-12 text-center">
          <Calendar className="mb-3 size-8 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">No events planned yet</p>
        </GlassCard>
      ) : (
        <>
          {upcoming.length > 0 && (
            <motion.div
              className="space-y-3"
              variants={eventContainerVariants}
              initial="hidden"
              animate="visible"
            >
              <h3 className="text-xs font-semibold text-[var(--text-secondary)]">Upcoming</h3>
              {upcoming.map((event) => (
                <motion.div key={event.id} variants={eventItemVariants}>
                  <EventCard event={event} canManage={canManage} />
                </motion.div>
              ))}
            </motion.div>
          )}
          {past.length > 0 && (
            <motion.div
              className="space-y-3"
              variants={eventContainerVariants}
              initial="hidden"
              animate="visible"
            >
              <h3 className="text-xs font-semibold text-[var(--text-secondary)]">Past</h3>
              {past.map((event) => (
                <motion.div key={event.id} variants={eventItemVariants}>
                  <EventCard event={event} canManage={canManage} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}

      <CreateEventModal groupId={groupId} open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
