import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";
import { soundManager } from "@/lib/soundManager";
import type { RootState } from "../store";

export interface PeriodLog {
  id: string;
  userId: string;
  startDate: string;
  endDate: string | null;
  cycleLength: number | null;
  flowIntensity: string | null;
  symptoms: string[];
  notes: string | null;
  createdAt: string;
}

export const periodLogApi = createApi({
  reducerPath: "periodLogApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/period-logs`),
  tagTypes: ["PeriodLogs"],
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getPeriodLogs: builder.query({
      query: (params: { limit?: number; cursor?: string }) => {
        const search = new URLSearchParams();
        if (params.limit) search.set("limit", String(params.limit));
        if (params.cursor) search.set("cursor", params.cursor);
        return `/?${search.toString()}`;
      },
      providesTags: ["PeriodLogs"],
      keepUnusedDataFor: 300,
    }),
    createPeriodLog: builder.mutation({
      query: (body: {
        startDate: string;
        endDate?: string;
        cycleLength?: number;
        flowIntensity?: string;
        symptoms?: string[];
        notes?: string;
      }) => ({
        url: "/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PeriodLogs"],
      onQueryStarted: async (_args, { dispatch, getState, queryFulfilled }) => {
        try {
          const { data: res } = await queryFulfilled;
          const log = (res as { data: PeriodLog }).data;
          if (!log) return;
          const state = getState() as RootState;
          const queries = state?.periodLogApi?.queries ?? {};
          for (const key of Object.keys(queries)) {
            const q = queries[key];
            if (q?.endpointName === "getPeriodLogs" && q?.status === "fulfilled") {
              dispatch(
                periodLogApi.util.updateQueryData("getPeriodLogs", q.originalArgs, (draft) => {
                  const d = draft as { logs?: PeriodLog[] };
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
    updatePeriodLog: builder.mutation({
      query: ({
        id,
        ...body
      }: { id: string } & Partial<{
        startDate: string;
        endDate: string | null;
        cycleLength: number | null;
        flowIntensity: string | null;
        symptoms: string[];
        notes: string | null;
      }>) => ({
        url: `/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["PeriodLogs"],
      onQueryStarted: async ({ id, ...body }, { dispatch, getState, queryFulfilled }) => {
        const patches: { undo: () => void }[] = [];
        const state = getState() as RootState;
        const queries = state?.periodLogApi?.queries ?? {};
        for (const key of Object.keys(queries)) {
          const q = queries[key];
          if (q?.endpointName === "getPeriodLogs" && q?.status === "fulfilled") {
            try {
              const p = dispatch(
                periodLogApi.util.updateQueryData("getPeriodLogs", q.originalArgs, (draft) => {
                  const d = draft as { logs?: PeriodLog[] };
                  if (d.logs) {
                    const idx = d.logs.findIndex((l) => l.id === id);
                    if (idx >= 0) Object.assign(d.logs[idx], body);
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
          soundManager.playError();
          patches.forEach((p) => p.undo());
        }
      },
    }),
    deletePeriodLog: builder.mutation({
      query: (id: string) => ({ url: `/${id}`, method: "DELETE" }),
      invalidatesTags: ["PeriodLogs"],
      onQueryStarted: async (id, { dispatch, getState, queryFulfilled }) => {
        const patches: { undo: () => void }[] = [];
        const state = getState() as RootState;
        const queries = state?.periodLogApi?.queries ?? {};
        for (const key of Object.keys(queries)) {
          const q = queries[key];
          if (q?.endpointName === "getPeriodLogs" && q?.status === "fulfilled") {
            try {
              const p = dispatch(
                periodLogApi.util.updateQueryData("getPeriodLogs", q.originalArgs, (draft) => {
                  const d = draft as { logs?: PeriodLog[] };
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
          soundManager.playError();
          patches.forEach((p) => p.undo());
        }
      },
    }),
  }),
});

export const {
  useGetPeriodLogsQuery,
  useCreatePeriodLogMutation,
  useUpdatePeriodLogMutation,
  useDeletePeriodLogMutation,
} = periodLogApi;
