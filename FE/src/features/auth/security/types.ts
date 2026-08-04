import type { AuditLogAction } from "@/features/auth/security/constants";

export type AuditLogResult = "SUCCESS" | "FAILED";

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: AuditLogAction | string;
  result: AuditLogResult;
  ipAddress: string | null;
  timestamp: string;
  email?: string | null;
}

export interface AuditLogListParams {
  page?: number;
  limit?: number;
  action?: string;
  result?: AuditLogResult;
  from?: string;
  to?: string;
}

export interface AuditLogListResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

/** Returned when admin must enter OTP (API not yet available). */
export interface TwoFactorChallenge {
  challengeToken: string;
  email: string;
  expiresInSeconds?: number;
}

export interface TwoFactorVerifyRequest {
  challengeToken: string;
  code: string;
}

export interface AuthSecurityAlert {
  variant: "destructive" | "warning" | "default";
  title: string;
  description: string;
  retryAfterSeconds?: number;
}

export interface AuthApiErrorBody {
  message?: string;
  code?: string;
  retryAfterSeconds?: number;
  challengeToken?: string;
}
