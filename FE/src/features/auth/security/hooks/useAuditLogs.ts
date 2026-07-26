import { useQuery } from "@tanstack/react-query";
import { auditLogService } from "@/features/auth/security/services";
import type { AuditLogListParams } from "@/features/auth/security/types";
import { QUERY_KEYS } from "@/shared/constants";

interface UseAuditLogsOptions extends AuditLogListParams {
  /** Bật khi BE đã có GET /admin/audit-logs */
  enabled?: boolean;
}

/**
 * Đọc audit log — mặc định tắt cho đến khi Chinh có API.
 * Admin dashboard (Quốc Anh) có thể import hook này sau.
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
