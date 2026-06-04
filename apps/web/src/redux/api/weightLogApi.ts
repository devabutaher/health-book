import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";

export interface WeightLog {
  id: string;
  userId: string;
  weight: number;
  bodyFat: number | null;
  waist: number | null;
  hips: number | null;
  chest: number | null;
  arms: number | null;
  date: string;
  notes: string | null;
  createdAt: string;
}

export const weightLogApi = createApi({
  reducerPath: "weightLogApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/weight-logs`),
  tagTypes: ["WeightLogs"],
  endpoints: (builder) => ({
    getWeightLogs: builder.query({
      query: (params: { limit?: number; cursor?: string }) => {
        const search = new URLSearchParams();
        if (params.limit) search.set("limit", String(params.limit));
        if (params.cursor) search.set("cursor", params.cursor);
        return `/?${search.toString()}`;
      },
      providesTags: ["WeightLogs"],
    }),
    getWeightHistory: builder.query({
      query: ({ days }: { days?: number } = {}) => `/history${days ? `?days=${days}` : ""}`,
      providesTags: ["WeightLogs"],
    }),
    createWeightLog: builder.mutation({
      query: (body: {
        weight: number;
        date?: string;
        notes?: string;
        bodyFat?: number;
        waist?: number;
        hips?: number;
        chest?: number;
        arms?: number;
      }) => ({
        url: "/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["WeightLogs"],
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        try {
          const { data: res } = await queryFulfilled;
          const log = (res as { data: WeightLog }).data;
          if (!log) return;
          dispatch(
            weightLogApi.util.updateQueryData("getWeightLogs", { limit: 50 }, (draft) => {
              if ((draft as { logs?: WeightLog[] }).logs) {
                (draft as { logs: WeightLog[] }).logs.unshift(log);
              }
            }),
          );
        } catch {}
      },
    }),
    updateWeightLog: builder.mutation({
      query: ({
        id,
        ...body
      }: {
        id: string;
        weight?: number;
        date?: string;
        notes?: string | null;
        bodyFat?: number | null;
        waist?: number | null;
        hips?: number | null;
        chest?: number | null;
        arms?: number | null;
      }) => ({
        url: `/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["WeightLogs"],
      onQueryStarted: async ({ id, ...body }, { dispatch, queryFulfilled }) => {
        const patches: { undo: () => void }[] = [];
        for (const args of [{ limit: 50 }, {}]) {
          try {
            const p = dispatch(
              weightLogApi.util.updateQueryData("getWeightLogs", args, (draft) => {
                const d = draft as { logs?: WeightLog[] };
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
    deleteWeightLog: builder.mutation({
      query: (id: string) => ({ url: `/${id}`, method: "DELETE" }),
      invalidatesTags: ["WeightLogs"],
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        const patches: { undo: () => void }[] = [];
        for (const args of [{ limit: 50 }, {}]) {
          try {
            const p = dispatch(
              weightLogApi.util.updateQueryData("getWeightLogs", args, (draft) => {
                const d = draft as { logs?: WeightLog[] };
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
  useGetWeightLogsQuery,
  useGetWeightHistoryQuery,
  useCreateWeightLogMutation,
  useUpdateWeightLogMutation,
  useDeleteWeightLogMutation,
} = weightLogApi;
