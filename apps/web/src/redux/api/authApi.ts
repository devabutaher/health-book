import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../baseQuery";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: createBaseQuery(`${process.env["NEXT_PUBLIC_API_URL"]}/api/auth`),
  tagTypes: ["Me"],
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body: { email: string; password: string }) => ({
        url: "/login",
        method: "POST",
        body,
      }),
    }),
    register: builder.mutation({
      query: (body: {
        name: string;
        email: string;
        password: string;
        username: string;
        gender: string;
      }) => ({
        url: "/register",
        method: "POST",
        body,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/logout",
        method: "POST",
      }),
    }),
    getMe: builder.query({
      query: () => "/me",
      providesTags: ["Me"],
      keepUnusedDataFor: 600,
    }),
    forgotPassword: builder.mutation({
      query: (body: { email: string }) => ({
        url: "/forgot-password",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
  useForgotPasswordMutation,
} = authApi;
