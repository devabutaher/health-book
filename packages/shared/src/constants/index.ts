export const API_VERSION = "v1";
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_FILE_SIZE_MB = 10;
export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const HEALTH_LOG_TYPES = ["workout", "meal", "mood", "sleep"] as const;
export type HealthLogType = (typeof HEALTH_LOG_TYPES)[number];

export const ROUTES = {
  HOME: "/",
  FEED: "/feed",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: (username: string) => `/profile/${username}`,
  POST: (id: string) => `/post/${id}`,
  MY_BOOK: "/my-book",
  MESSAGES: "/messages",
  GROUPS: "/groups",
  EXPERTS: "/experts",
  ADMIN: "/admin",
} as const;
