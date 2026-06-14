import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import { soundManager } from "@/lib/soundManager";
import type { RootState } from "../store";
import type {
  Group,
  GroupMember,
  GroupJoinRequest,
  GroupInvite,
  GroupListData,
} from "@/types/group";

export const groupsApi = createApi({
  reducerPath: "groupsApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/groups`),
  tagTypes: [
    "Groups",
    "Group",
    "GroupMembers",
    "GroupJoinRequests",
    "GroupInvites",
    "MyGroups",
    "MyInvites",
  ],
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    browseGroups: builder.query<GroupListData, { cursor?: string }>({
      query: ({ cursor }) => (cursor ? `/?cursor=${cursor}` : "/"),
      providesTags: ["Groups"],
      transformResponse: (response: { success: boolean; data: GroupListData }) => response.data,
      keepUnusedDataFor: 600,
    }),

    searchGroups: builder.query<GroupListData, { q: string; cursor?: string }>({
      query: ({ q, cursor }) =>
        `/search?q=${encodeURIComponent(q)}${cursor ? `&cursor=${cursor}` : ""}`,
      providesTags: ["Groups"],
      transformResponse: (response: { success: boolean; data: GroupListData }) => response.data,
      keepUnusedDataFor: 600,
    }),

    getMyGroups: builder.query<Group[], void>({
      query: () => "/my",
      providesTags: ["MyGroups"],
      transformResponse: (response: { success: boolean; data: Group[] }) => response.data,
      keepUnusedDataFor: 600,
    }),

    getGroup: builder.query<Group, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Group", id }],
      transformResponse: (response: { success: boolean; data: Group }) => response.data,
      keepUnusedDataFor: 600,
    }),

    createGroup: builder.mutation<
      Group,
      {
        name: string;
        description?: string;
        avatar?: string;
        coverPhoto?: string;
        type?: "PUBLIC" | "PRIVATE" | "SECRET";
      }
    >({
      query: (body) => ({
        url: "/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Groups", "MyGroups"],
      transformResponse: (response: { success: boolean; data: Group }) => response.data,
      onQueryStarted: async (args, { dispatch, getState, queryFulfilled }) => {
        const user = (getState() as RootState).auth.user;
        if (!user) return;
        const tempId = `temp-${Date.now()}`;

        const optimistic: Group = {
          id: tempId,
          name: args.name,
          description: args.description || null,
          avatar: args.avatar || null,
          coverPhoto: args.coverPhoto || null,
          type: args.type || "PUBLIC",
          createdById: user.id,
          memberCount: 1,
          isMember: true,
          myRole: "ADMIN",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const patches: { undo: () => void }[] = [];
        patches.push(
          dispatch(
            groupsApi.util.updateQueryData("getMyGroups", undefined, (draft) => {
              draft.unshift(optimistic);
            }),
          ),
        );
        const state = getState() as RootState;
        const queries = state?.groupsApi?.queries ?? {};
        for (const key of Object.keys(queries)) {
          const q = queries[key];
            if ((q?.endpointName === "browseGroups" || q?.endpointName === "searchGroups") && q?.status === "fulfilled") {
            patches.push(
              dispatch(
                groupsApi.util.updateQueryData(q.endpointName, q.originalArgs, (draft: GroupListData) => {
                  if (draft?.groups) draft.groups.unshift(optimistic);
                }),
              ),
            );
          }
        }

        try {
          const { data } = await queryFulfilled;
          for (const key of Object.keys(queries)) {
            const q = queries[key];
            if (q?.endpointName === "getMyGroups" && q?.status === "fulfilled") {
              dispatch(
                groupsApi.util.updateQueryData("getMyGroups", q.originalArgs, (draft) => {
                  const idx = draft.findIndex((g) => g.id === tempId);
                  if (idx >= 0) draft[idx].id = data.id;
                }),
              );
            }
            if ((q?.endpointName === "browseGroups" || q?.endpointName === "searchGroups") && q?.status === "fulfilled") {
              dispatch(
                groupsApi.util.updateQueryData(q.endpointName, q.originalArgs, (draft: GroupListData) => {
                  if (draft?.groups) {
                    const idx = draft.groups.findIndex((g) => g.id === tempId);
                    if (idx >= 0) draft.groups[idx].id = data.id;
                  }
                }),
              );
            }
          }
        } catch {
          patches.forEach((p) => p.undo());
          soundManager.playError();
        }
      },
    }),

    updateGroup: builder.mutation<
      Group,
      {
        id: string;
        name?: string;
        description?: string;
        avatar?: string;
        coverPhoto?: string;
        type?: "PUBLIC" | "PRIVATE" | "SECRET";
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Group", id }, "Groups"],
      transformResponse: (response: { success: boolean; data: Group }) => response.data,
      onQueryStarted: async ({ id }, { dispatch, queryFulfilled }) => {
        try {
          const updated = (await queryFulfilled).data;
          dispatch(
            groupsApi.util.updateQueryData("getGroup", id, (draft) => {
              Object.assign(draft, updated, {
                memberCount: draft.memberCount,
                isMember: draft.isMember,
                myRole: draft.myRole,
              });
            }),
          );
        } catch {
          soundManager.playError();
        }
      },
    }),

    deleteGroup: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Group", id }, "Groups", "MyGroups"],
    }),

    joinGroup: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}/join`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Group", id }, "Groups", "MyGroups"],
      onQueryStarted: async (id, { dispatch, getState, queryFulfilled }) => {
        const userId = (getState() as RootState).auth.user?.id;
        if (!userId) return;
        const patchGroup = dispatch(
          groupsApi.util.updateQueryData("getGroup", id, (draft) => {
            draft.isMember = true;
            draft.myRole = "MEMBER";
            draft.memberCount = (draft.memberCount || 0) + 1;
          }),
        );
        const patchMyGroups = dispatch(
          groupsApi.util.updateQueryData("getMyGroups", undefined, (draft) => {
            const exists = draft.some((g) => g.id === id);
            if (!exists) {
              draft.unshift({
                id,
                name: "",
                description: null,
                avatar: null,
                coverPhoto: null,
                type: "PUBLIC",
                createdById: "",
                memberCount: 0,
                isMember: true,
                myRole: "MEMBER",
                createdAt: "",
                updatedAt: "",
              });
            }
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patchGroup.undo();
          patchMyGroups.undo();
          soundManager.playError();
        }
      },
    }),

    leaveGroup: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}/leave`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Group", id }, "Groups", "MyGroups"],
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        const patchGroup = dispatch(
          groupsApi.util.updateQueryData("getGroup", id, (draft) => {
            draft.isMember = false;
            draft.myRole = null;
            draft.memberCount = Math.max(0, (draft.memberCount || 1) - 1);
          }),
        );
        const patchMyGroups = dispatch(
          groupsApi.util.updateQueryData("getMyGroups", undefined, (draft) => {
            const idx = draft.findIndex((g) => g.id === id);
            if (idx !== -1) draft.splice(idx, 1);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patchGroup.undo();
          patchMyGroups.undo();
          soundManager.playError();
        }
      },
    }),

    requestJoinGroup: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}/join-requests`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Group", id },
        { type: "GroupJoinRequests", id },
      ],
    }),

    getJoinRequests: builder.query<GroupJoinRequest[], string>({
      query: (groupId) => `/${groupId}/join-requests`,
      providesTags: (_result, _error, groupId) => [{ type: "GroupJoinRequests", id: groupId }],
      transformResponse: (response: { success: boolean; data: GroupJoinRequest[] }) =>
        response.data,
      keepUnusedDataFor: 600,
    }),

    approveJoinRequest: builder.mutation<void, { groupId: string; userId: string }>({
      query: ({ groupId, userId }) => ({
        url: `/${groupId}/join-requests/${userId}/approve`,
        method: "PUT",
      }),
      invalidatesTags: (_result, _error, { groupId }) => [
        { type: "GroupJoinRequests", id: groupId },
        { type: "Group", id: groupId },
        { type: "GroupMembers", id: `${groupId}-members` },
      ],
    }),

    rejectJoinRequest: builder.mutation<void, { groupId: string; userId: string }>({
      query: ({ groupId, userId }) => ({
        url: `/${groupId}/join-requests/${userId}/reject`,
        method: "PUT",
      }),
      invalidatesTags: (_result, _error, { groupId }) => [
        { type: "GroupJoinRequests", id: groupId },
      ],
    }),

    inviteUser: builder.mutation<GroupInvite, { groupId: string; userId: string }>({
      query: ({ groupId, ...body }) => ({
        url: `/${groupId}/invite`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { groupId }) => [{ type: "GroupInvites", id: groupId }],
    }),

    getMyInvites: builder.query<GroupInvite[], void>({
      query: () => "/my/invites",
      providesTags: ["MyInvites"],
      transformResponse: (response: { success: boolean; data: GroupInvite[] }) => response.data,
      keepUnusedDataFor: 600,
    }),

    acceptInvite: builder.mutation<void, string>({
      query: (inviteId) => ({
        url: `/invites/${inviteId}/accept`,
        method: "PUT",
      }),
      invalidatesTags: ["MyInvites"],
      onQueryStarted: async (inviteId, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          groupsApi.util.updateQueryData("getMyInvites", undefined, (draft) => {
            const idx = draft.findIndex((i) => i.id === inviteId);
            if (idx !== -1) draft.splice(idx, 1);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
          soundManager.playError();
        }
      },
    }),

    declineInvite: builder.mutation<void, string>({
      query: (inviteId) => ({
        url: `/invites/${inviteId}/decline`,
        method: "PUT",
      }),
      invalidatesTags: ["MyInvites"],
      onQueryStarted: async (inviteId, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          groupsApi.util.updateQueryData("getMyInvites", undefined, (draft) => {
            const idx = draft.findIndex((i) => i.id === inviteId);
            if (idx !== -1) draft.splice(idx, 1);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
          soundManager.playError();
        }
      },
    }),

    getGroupInvites: builder.query<GroupInvite[], string>({
      query: (groupId) => `/${groupId}/invites`,
      providesTags: (_result, _error, groupId) => [{ type: "GroupInvites", id: groupId }],
      transformResponse: (response: { success: boolean; data: GroupInvite[] }) => response.data,
      keepUnusedDataFor: 600,
    }),

    uploadGroupMedia: builder.mutation<{ url: string }, FormData>({
      query: (formData) => ({
        url: "/media",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: { success: boolean; data: { url: string } }) => response.data,
    }),

    getGroupMembers: builder.query<
      { members: GroupMember[]; nextCursor: string | null; hasMore: boolean },
      { groupId: string; cursor?: string }
    >({
      query: ({ groupId, cursor }) => `/${groupId}/members${cursor ? `?cursor=${cursor}` : ""}`,
      providesTags: (_result, _error, { groupId }) => [
        { type: "GroupMembers", id: `${groupId}-members` },
      ],
      transformResponse: (response: {
        success: boolean;
        data: { members: GroupMember[]; nextCursor: string | null; hasMore: boolean };
      }) => response.data,
      keepUnusedDataFor: 600,
    }),

    updateMemberRole: builder.mutation<
      GroupMember,
      { groupId: string; userId: string; role: "ADMIN" | "MODERATOR" | "MEMBER" }
    >({
      query: ({ groupId, userId, ...body }) => ({
        url: `/${groupId}/members/${userId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { groupId }) => [
        { type: "GroupMembers", id: `${groupId}-members` },
        { type: "Group", id: groupId },
      ],
    }),

    removeMember: builder.mutation<void, { groupId: string; userId: string }>({
      query: ({ groupId, userId }) => ({
        url: `/${groupId}/members/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { groupId }) => [
        { type: "GroupMembers", id: `${groupId}-members` },
        { type: "Group", id: groupId },
      ],
    }),
  }),
});

export const {
  useBrowseGroupsQuery,
  useSearchGroupsQuery,
  useGetMyGroupsQuery,
  useGetGroupQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useJoinGroupMutation,
  useLeaveGroupMutation,
  useRequestJoinGroupMutation,
  useGetJoinRequestsQuery,
  useApproveJoinRequestMutation,
  useRejectJoinRequestMutation,
  useInviteUserMutation,
  useGetMyInvitesQuery,
  useAcceptInviteMutation,
  useDeclineInviteMutation,
  useGetGroupInvitesQuery,
  useUploadGroupMediaMutation,
  useGetGroupMembersQuery,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
} = groupsApi;
