import { createApi } from "@reduxjs/toolkit/query/react"
import { createBaseQuery } from "../baseQuery"

export const pushApi = createApi({
  reducerPath: "pushApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/push`),
  endpoints: (builder) => ({
    getVapidPublicKey: builder.query<{ publicKey: string }, void>({
      query: () => "/vapid-public-key",
      transformResponse: (res: { success: boolean; publicKey: string }) => res,
    }),
    subscribePush: builder.mutation<void, { endpoint: string; p256dh: string; auth: string }>({
      query: (body) => ({ url: "/subscribe", method: "POST", body }),
    }),
    unsubscribePush: builder.mutation<void, { endpoint: string }>({
      query: (body) => ({ url: "/unsubscribe", method: "DELETE", body }),
    }),
  }),
})

export const { useGetVapidPublicKeyQuery, useSubscribePushMutation, useUnsubscribePushMutation } = pushApi
