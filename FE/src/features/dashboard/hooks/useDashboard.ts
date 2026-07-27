import { useQuery } from "@tanstack/react-query";
import { dashboardService, dashboardQueryKeys } from "../services";

export function useAuditLogsQuery() {
  return useQuery({
    queryKey: dashboardQueryKeys.logs(),
    queryFn: () => dashboardService.getAuditLogs(),
    staleTime: 10000,
  });
}
