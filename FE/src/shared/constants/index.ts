export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh-token",
    ME: "/auth/me",
  },
  USERS: {
    LIST: "/admin/users",
    CREATE: "/admin/users",
    UPDATE: (id: string) => `/admin/users/${id}`,
    UPDATE_STATUS: (id: string) => `/admin/users/${id}/status`,
    LOCK: (id: string) => `/admin/users/${id}/lock`,
    UNLOCK: (id: string) => `/admin/users/${id}/unlock`,
    DELETE: (id: string) => `/admin/users/${id}`,
    RESTORE: (id: string) => `/admin/users/${id}/restore`,
    RESET_PASSWORD: (id: string) => `/admin/users/${id}/reset-password`,
    ASSIGN_ROLE: (id: string) => `/admin/users/${id}/role`,
  },
  ROLES: {
    LIST: "/admin/roles",
    CREATE: "/admin/roles",
    GET: (id: string) => `/admin/roles/${id}`,
    UPDATE: (id: string) => `/admin/roles/${id}`,
    DELETE: (id: string) => `/admin/roles/${id}`,
    ASSIGN_PERMISSIONS: (id: string) => `/admin/roles/${id}/permissions`,
  },
  PERMISSIONS: {
    LIST: "/admin/permissions",
  },
  DOCUMENTS: {
    LIST: "/admin/documents",
    UPLOAD: "/admin/documents",
    UPDATE_STATUS: (id: string) => `/admin/documents/${id}/status`,
    DELETE: (id: string) => `/admin/documents/${id}`,
  },
  QA: {
    LIST: "/admin/qa",
  },
  COURSES: {
    LIST: "/admin/courses",
    CREATE: "/admin/courses",
    UPDATE: (id: string) => `/admin/courses/${id}`,
    UPDATE_STATUS: (id: string) => `/admin/courses/${id}/status`,
    DELETE: (id: string) => `/admin/courses/${id}`,
    GET_ENROLLMENTS: (courseId: string) => `/admin/courses/${courseId}/enrollments`,
    SAVE_ENROLLMENTS: (courseId: string) => `/admin/courses/${courseId}/enrollments`,
  },
  CHAT: {
    HISTORY: (courseId: string) => `/student/chat/history/${courseId}`,
    SEND: "/student/chat/send",
  },
  DASHBOARD: {
    LOGS: "/admin/dashboard/logs",
  },
} as const;

export const QUERY_KEYS = {
  AUTH: ["auth"] as const,
  AUDIT_LOGS: ["auth", "audit-logs"] as const,
  USERS: ["users"] as const,
  ROLES: ["roles"] as const,
  PERMISSIONS: ["permissions"] as const,
  DOCUMENTS: ["documents"] as const,
  QA: ["qa"] as const,
  COURSES: ["courses"] as const,
  CHAT: ["chat"] as const,
  DASHBOARD: ["dashboard"] as const,
} as const;
