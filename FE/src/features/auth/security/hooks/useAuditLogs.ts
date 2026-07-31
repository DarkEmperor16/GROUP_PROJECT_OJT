import { useQuery } from "@tanstack/react-query";
import { auditLogService } from "@/features/auth/security/services";
import type { AuditLogListParams } from "@/features/auth/security/types";
import { QUERY_KEYS } from "@/shared/constants";

interface UseAuditLogsOptions extends AuditLogListParams {
  /** Enable when GET /admin/audit-logs is available */
  enabled?: boolean;
}

/**
 * Read audit logs — disabled by default until the backend API ships.
 * Admin dashboard can import this hook later.
 */
export function useAuditLogs({
  enabled = false,
  ...params
}: UseAuditLogsOptions = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.AUDIT_LOGS, params],
    queryFn: () => auditLogService.list(params),
    enabled,
    staleTime: 30_000,
  });
}
