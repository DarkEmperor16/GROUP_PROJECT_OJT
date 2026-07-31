import apiClient from "@/lib/axios";
import { AUTH_SECURITY_ENDPOINTS } from "@/features/auth/security/constants";
import type {
  AuditLogListParams,
  AuditLogListResponse,
  TwoFactorVerifyRequest,
} from "@/features/auth/security/types";
import type { LoginResponse } from "@/features/auth/types";
import { extractTokenPair } from "@/features/auth/utils/tokenResponse";

function normalizeAuditLogResponse(data: unknown): AuditLogListResponse {
  const payload = data as AuditLogListResponse & {
    data?: AuditLogListResponse;
    items?: AuditLogListResponse["items"];
  };

  if (payload.data?.items) {
    return payload.data;
  }

  if (payload.items) {
    return {
      items: payload.items,
      total: payload.total ?? payload.items.length,
      page: payload.page ?? 1,
      limit: payload.limit ?? payload.items.length,
    };
  }

  return { items: [], total: 0, page: 1, limit: 20 };
}

/**
 * Read audit logs via the backend — FE does not write to the database.
 * API not ready yet: hook defaults to `enabled: false`.
 */
export const auditLogService = {
  async list(params?: AuditLogListParams): Promise<AuditLogListResponse> {
    const data = await apiClient.get(AUTH_SECURITY_ENDPOINTS.AUDIT_LOGS, {
      params,
    });
    return normalizeAuditLogResponse(data);
  },
};

/** Step-2 OTP verification — pending backend API. */
export const twoFactorService = {
  async verify(request: TwoFactorVerifyRequest): Promise<LoginResponse> {
    const data = (await apiClient.post(
      AUTH_SECURITY_ENDPOINTS.TWO_FACTOR_VERIFY,
      request,
    )) as Record<string, unknown>;

    const { accessToken, refreshToken } = extractTokenPair(data);
    const user =
      (data.user as LoginResponse["user"]) ??
      (data as { user?: LoginResponse["user"] }).user;

    if (!accessToken || !user) {
      throw new Error("Invalid 2FA verification response");
    }

    return { accessToken, refreshToken, user };
  },
};
