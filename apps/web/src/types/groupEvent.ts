export interface GroupEvent {
  id: string;
  groupId: string;
  createdById: string;
  creator?: { id: string; name: string; username: string; avatar: string | null };
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  maxAttendees: number | null;
  rsvpCounts: { GOING: number; MAYBE: number; NOT_GOING: number };
  myRsvp: string | null;
  createdAt: string;
}
