export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh-token",
    ME: "/auth/me",
  },
} as const;

export const QUERY_KEYS = {
  AUTH: ["auth"] as const,
  AUDIT_LOGS: ["auth", "audit-logs"] as const,
} as const;
