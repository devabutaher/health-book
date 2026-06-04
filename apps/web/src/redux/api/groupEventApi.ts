import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import type { GroupEvent } from "@/types/groupEvent";

export const groupEventApi = createApi({
  reducerPath: "groupEventApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/groups`),
  tagTypes: ["GroupEvents", "GroupEvent"],
  endpoints: (builder) => ({
    getGroupEvents: builder.query<GroupEvent[], string>({
      query: (groupId) => `/${groupId}/events`,
      providesTags: (_result, _error, groupId) => [{ type: "GroupEvents", id: groupId }],
      transformResponse: (response: { success: boolean; data: GroupEvent[] }) => response.data,
    }),
    createEvent: builder.mutation<
      GroupEvent,
      {
        groupId: string;
        title: string;
        description?: string;
        date: string;
        location?: string;
        maxAttendees?: number;
      }
    >({
      query: ({ groupId, ...body }) => ({
        url: `/${groupId}/events`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { groupId }) => [{ type: "GroupEvents", id: groupId }],
    }),
    rsvpEvent: builder.mutation<GroupEvent, { groupId: string; eventId: string; status: string }>({
      query: ({ groupId, eventId, status }) => ({
        url: `/${groupId}/events/${eventId}/rsvp`,
        method: "POST",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { groupId }) => [{ type: "GroupEvents", id: groupId }],
    }),
    deleteEvent: builder.mutation<void, { eventId: string; groupId: string }>({
      query: ({ eventId, groupId }) => ({
        url: `/${groupId}/events/${eventId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { groupId }) => [{ type: "GroupEvents", id: groupId }],
    }),
  }),
});

export const {
  useGetGroupEventsQuery,
  useCreateEventMutation,
  useRsvpEventMutation,
  useDeleteEventMutation,
} = groupEventApi;
