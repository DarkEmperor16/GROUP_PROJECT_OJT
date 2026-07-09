/** Auth security error codes — contract với BE (Chinh). */
export const AUTH_SECURITY_ERROR_CODES = {
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  TWO_FACTOR_REQUIRED: "TWO_FACTOR_REQUIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_INACTIVE: "ACCOUNT_INACTIVE",
} as const;

export type AuthSecurityErrorCode =
  (typeof AUTH_SECURITY_ERROR_CODES)[keyof typeof AUTH_SECURITY_ERROR_CODES];

/** API endpoints — chờ BE implement. FE chỉ gọi đọc, không ghi DB. */
export const AUTH_SECURITY_ENDPOINTS = {
  /** Danh sách audit log (Admin / Security) */
  AUDIT_LOGS: "/admin/audit-logs",
  /** Xác thực OTP bước 2 sau login */
  TWO_FACTOR_VERIFY: "/auth/2fa/verify",
} as const;

export const AUDIT_LOG_ACTIONS = {
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT",
  TOKEN_REFRESH: "TOKEN_REFRESH",
  REGISTER_SUCCESS: "REGISTER_SUCCESS",
} as const;

export type AuditLogAction =
  (typeof AUDIT_LOG_ACTIONS)[keyof typeof AUDIT_LOG_ACTIONS];
