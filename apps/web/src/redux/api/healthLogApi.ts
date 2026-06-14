import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import { soundManager } from "@/lib/soundManager";
import { postApi } from "./postApi";
import type { RootState } from "../store";
import type { PostSingleResponse, PostApiResponse } from "@/types/post";

export interface HealthLog {
  id: string;
  userId: string;
  type: "ROUTINE" | "GOAL" | "WORKOUT" | "MOOD" | "QUICK";
  date: string;
  data: Record<string, unknown>;
  score: number | null;
  isPublic: boolean;
  createdAt: string;
}

export interface HealthLogListResponse {
  success: boolean;
  logs: HealthLog[];
  nextCursor: string | null;
}

export interface HealthStatsResponse {
  success: boolean;
  data: {
    streak: number;
    totalLogs: number;
    avgScore: number;
    healthScore: number;
    byType: { type: string; count: number; avgScore: number }[];
  };
}

export interface CalendarResponse {
  success: boolean;
  data: {
    year: number;
    month: number;
    days: Record<string, { score: number; count: number; types: string[] }>;
  };
}

export const healthLogApi = createApi({
  reducerPath: "healthLogApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/health-logs`),
  tagTypes: ["HealthLogs", "HealthStats", "Calendar"],
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getHealthLogs: builder.query({
      query: (params: { type?: string; limit?: number; cursor?: string }) => {
        const search = new URLSearchParams();
        if (params.type) search.set("type", params.type);
        if (params.limit) search.set("limit", String(params.limit));
        if (params.cursor) search.set("cursor", params.cursor);
        return `/?${search.toString()}`;
      },
      providesTags: ["HealthLogs"],
      keepUnusedDataFor: 300,
    }),
    getHealthLog: builder.query({
      query: (id: string) => `/${id}`,
      providesTags: (_result: unknown, _error: unknown, id: string) => [
        { type: "HealthLogs" as const, id },
      ],
      keepUnusedDataFor: 300,
    }),
    createHealthLog: builder.mutation({
      query: (body: {
        type: "ROUTINE" | "GOAL" | "WORKOUT" | "MOOD" | "QUICK";
        date?: string;
        data: Record<string, unknown>;
        isPublic?: boolean;
      }) => ({
        url: "/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["HealthLogs", "HealthStats", "Calendar"],
      onQueryStarted: async (args, { dispatch, getState, queryFulfilled }) => {
        const user = (getState() as RootState).auth.user;
        if (!user) return;
        const tempId = `temp-${Date.now()}`;

        const optimistic: HealthLog = {
          id: tempId,
          userId: user.id,
          type: args.type,
          date: args.date || new Date().toISOString(),
          data: args.data,
          score: null,
          isPublic: args.isPublic || false,
          createdAt: new Date().toISOString(),
        };

        const patches: { undo: () => void }[] = [];
        const state = getState() as RootState;
        const queries = state?.healthLogApi?.queries ?? {};
        for (const key of Object.keys(queries)) {
          const q = queries[key];
          if (q?.endpointName === "getHealthLogs" && q?.status === "fulfilled") {
            patches.push(
              dispatch(
                healthLogApi.util.updateQueryData("getHealthLogs", q.originalArgs, (draft) => {
                  const d = draft as { logs: HealthLog[] };
                  if (d.logs) d.logs.unshift(optimistic);
                }),
              ),
            );
          }
        }

        try {
          const { data: res } = await queryFulfilled;
          const log = (res as { data: HealthLog }).data;
          if (!log?.id) return;
          for (const key of Object.keys(queries)) {
            const q = queries[key];
            if (q?.endpointName === "getHealthLogs" && q?.status === "fulfilled") {
              dispatch(
                healthLogApi.util.updateQueryData("getHealthLogs", q.originalArgs, (draft) => {
                  const d = draft as { logs: HealthLog[] };
                  if (d.logs) {
                    const idx = d.logs.findIndex((l) => l.id === tempId);
                    if (idx >= 0) d.logs[idx].id = log.id;
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
    updateHealthLog: builder.mutation({
      query: ({
        id,
        ...body
      }: {
        id: string;
        type?: string;
        date?: string;
        data?: Record<string, unknown>;
        isPublic?: boolean;
      }) => ({
        url: `/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "HealthLogs", id }, "HealthStats"],
      onQueryStarted: async ({ id, ...body }, { dispatch, getState, queryFulfilled }) => {
        const patches: { undo: () => void }[] = [];
        patches.push(
          dispatch(
            healthLogApi.util.updateQueryData("getHealthLog", id, (draft) => {
              if (!draft) return;
              Object.assign(draft as object, body);
            }),
          ),
        );
        const state = getState() as RootState;
        const queries = state?.healthLogApi?.queries ?? {};
        for (const key of Object.keys(queries)) {
          const q = queries[key];
          if (q?.endpointName === "getHealthLogs" && q?.status === "fulfilled") {
            patches.push(
              dispatch(
                healthLogApi.util.updateQueryData("getHealthLogs", q.originalArgs, (draft) => {
                  const d = draft as { logs: HealthLog[] };
                  if (d.logs) {
                    const idx = d.logs.findIndex((l) => l.id === id);
                    if (idx >= 0) Object.assign(d.logs[idx] as object, body);
                  }
                }),
              ),
            );
          }
        }
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
          soundManager.playError();
        }
      },
    }),
    deleteHealthLog: builder.mutation({
      query: (id: string) => ({ url: `/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "HealthLogs", id }, "HealthStats"],
      onQueryStarted: async (id, { dispatch, getState, queryFulfilled }) => {
        const patches: { undo: () => void }[] = [];
        interface HealthLogQueryEntry {
          endpointName: string;
          status: string;
          originalArgs: { type?: string; limit?: number; cursor?: string };
        }
        const queries =
          (getState() as Record<string, { queries: Record<string, HealthLogQueryEntry> }>)
            ?.healthLogApi?.queries ?? {};
        for (const q of Object.values(queries)) {
          if (q?.endpointName === "getHealthLogs" && q?.status === "fulfilled") {
            try {
              const p = dispatch(
                healthLogApi.util.updateQueryData("getHealthLogs", q.originalArgs, (draft) => {
                  const d = draft as { logs?: HealthLog[] };
                  if (d.logs) {
                    d.logs = d.logs.filter((l) => l.id !== id);
                  }
                }),
              );
              patches.push(p);
            } catch {}
          }
        }
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
          soundManager.playError();
        }
      },
    }),
    copyHealthLog: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/copy`,
        method: "POST",
      }),
      invalidatesTags: ["HealthLogs", "HealthStats"],
      onQueryStarted: async (_id, { dispatch, getState, queryFulfilled }) => {
        try {
          const { data: res } = await queryFulfilled;
          const log = (res as { data: HealthLog }).data;
          if (!log) return;
          const state = getState() as RootState;
          const queries = state?.healthLogApi?.queries ?? {};
          for (const key of Object.keys(queries)) {
            const q = queries[key];
            if (q?.endpointName === "getHealthLogs" && q?.status === "fulfilled") {
              dispatch(
                healthLogApi.util.updateQueryData("getHealthLogs", q.originalArgs, (draft) => {
                  const d = draft as { logs: HealthLog[] };
                  if (d.logs) d.logs.unshift(log);
                }),
              );
            }
          }
        } catch {
          soundManager.playError();
        }
      },
    }),

    shareHealthLog: builder.mutation({
      query: ({ id, content }: { id: string; content: string }) => ({
        url: `/${id}/share`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: ["HealthLogs"],
      onQueryStarted: async (_args, { dispatch, getState, queryFulfilled }) => {
        try {
          const { data: res } = await queryFulfilled;
          const newPost = (res as PostSingleResponse)?.data;
          if (!newPost) return;
          const state = getState() as RootState;
          const queries = state?.postApi?.queries ?? {};
          for (const key of Object.keys(queries)) {
            const q = queries[key];
            if (q?.endpointName === "getFeed" && q?.status === "fulfilled") {
              dispatch(
                postApi.util.updateQueryData("getFeed", q.originalArgs, (draft: PostApiResponse) => {
                  if (draft?.data?.posts) {
                    draft.data.posts.unshift(newPost);
                  }
                }),
              );
            }
          }
        } catch {
          soundManager.playError();
        }
      },
    }),
    getHealthStats: builder.query({
      query: () => "/stats",
      providesTags: ["HealthStats"],
      keepUnusedDataFor: 300,
    }),
    getTrends: builder.query({
      query: ({ days }: { days?: number } = {}) => `/trends${days ? `?days=${days}` : ""}`,
      providesTags: ["HealthStats"],
      keepUnusedDataFor: 300,
    }),
    getCalendar: builder.query({
      query: ({ year, month }: { year: number; month: number }) =>
        `/calendar?year=${year}&month=${month}`,
      providesTags: (_result, _error, { year, month }) => [
        { type: "Calendar" as const, id: `${year}-${month}` },
      ],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetHealthLogsQuery,
  useCreateHealthLogMutation,
  useDeleteHealthLogMutation,
  useShareHealthLogMutation,
  useCopyHealthLogMutation,
  useGetHealthStatsQuery,
  useGetTrendsQuery,
  useGetCalendarQuery,
} = healthLogApi;
