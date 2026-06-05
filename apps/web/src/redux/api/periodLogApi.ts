import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";

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
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        try {
          const { data: res } = await queryFulfilled;
          const log = (res as { data: PeriodLog }).data;
          if (!log) return;
          dispatch(
            periodLogApi.util.updateQueryData("getPeriodLogs", { limit: 50 }, (draft) => {
              if ((draft as { logs?: PeriodLog[] }).logs) {
                (draft as { logs: PeriodLog[] }).logs.unshift(log);
              }
            }),
          );
        } catch {}
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
      onQueryStarted: async ({ id, ...body }, { dispatch, queryFulfilled }) => {
        const patches: { undo: () => void }[] = [];
        for (const args of [{ limit: 50 }, {}]) {
          try {
            const p = dispatch(
              periodLogApi.util.updateQueryData("getPeriodLogs", args, (draft) => {
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
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),
    deletePeriodLog: builder.mutation({
      query: (id: string) => ({ url: `/${id}`, method: "DELETE" }),
      invalidatesTags: ["PeriodLogs"],
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        const patches: { undo: () => void }[] = [];
        for (const args of [{ limit: 50 }, {}]) {
          try {
            const p = dispatch(
              periodLogApi.util.updateQueryData("getPeriodLogs", args, (draft) => {
                const d = draft as { logs?: PeriodLog[] };
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
