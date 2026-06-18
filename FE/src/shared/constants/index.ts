export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
  },
} as const;

export const QUERY_KEYS = {
  AUTH: ["auth"] as const,
} as const;
