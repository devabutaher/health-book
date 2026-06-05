import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import { soundManager } from "@/lib/soundManager";

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
  tagTypes: ["HealthLogs", "HealthStats", "Calendar", "Feed", "Posts"],
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
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        try {
          const { data: res } = await queryFulfilled;
          const log = (res as { data: HealthLog }).data;
          if (!log) return;
          dispatch(
            healthLogApi.util.updateQueryData("getHealthLogs", { limit: 50 }, (draft) => {
              if ((draft as { logs: HealthLog[] }).logs) {
                (draft as { logs: HealthLog[] }).logs.unshift(log);
              }
            }),
          );
        } catch {}
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
      invalidatesTags: ["HealthLogs", "HealthStats", "Calendar"],
      onQueryStarted: async ({ id, ...body }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          healthLogApi.util.updateQueryData("getHealthLog", id, (draft) => {
            if (!draft) return;
            Object.assign(draft as object, body);
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
    deleteHealthLog: builder.mutation({
      query: (id: string) => ({ url: `/${id}`, method: "DELETE" }),
      invalidatesTags: ["HealthLogs", "HealthStats", "Calendar"],
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        const patches: { undo: () => void }[] = [];
        for (const args of [{ limit: 50 }, {}, { limit: 1 }, { type: "WORKOUT" as const, limit: 100 }]) {
          try {
            const p = dispatch(
              healthLogApi.util.updateQueryData("getHealthLogs", args, (draft) => {
                const d = draft as { logs?: HealthLog[] };
                if (d.logs) {
                  d.logs = d.logs.filter((l) => l.id !== id);
                }
              }),
            );
            patches.push(p);
          } catch {}
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
      onQueryStarted: async (_id, { dispatch, queryFulfilled }) => {
        try {
          const { data: res } = await queryFulfilled;
          const log = (res as { data: HealthLog }).data;
          if (!log) return;
          dispatch(
            healthLogApi.util.updateQueryData("getHealthLogs", { limit: 50 }, (draft) => {
              if ((draft as { logs: HealthLog[] }).logs) {
                (draft as { logs: HealthLog[] }).logs.unshift(log);
              }
            }),
          );
        } catch {}
      },
    }),

    shareHealthLog: builder.mutation({
      query: ({ id, content }: { id: string; content: string }) => ({
        url: `/${id}/share`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: ["Feed", "Posts", "HealthLogs"],
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
      providesTags: ["Calendar"],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetHealthLogsQuery,
  useGetHealthLogQuery,
  useCreateHealthLogMutation,
  useUpdateHealthLogMutation,
  useDeleteHealthLogMutation,
  useShareHealthLogMutation,
  useCopyHealthLogMutation,
  useGetHealthStatsQuery,
  useGetTrendsQuery,
  useGetCalendarQuery,
} = healthLogApi;
