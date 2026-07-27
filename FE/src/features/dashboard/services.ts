import apiClient from "@/lib/axios";
import { API_ENDPOINTS, QUERY_KEYS } from "@/shared/constants";

export interface SystemLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  level: "INFO" | "WARNING" | "ERROR";
  details: string;
}

interface BackendLogsResult {
  data?: SystemLog[];
  logs?: SystemLog[];
  result?: {
    data?: SystemLog[];
    logs?: SystemLog[];
  };
}

function normalizeLogsResponse(payload: BackendLogsResult): SystemLog[] {
  const body = payload.result ?? payload;
  return body.data ?? body.logs ?? payload.logs ?? payload.data ?? [];
}

export const dashboardService = {
  async getAuditLogs(): Promise<SystemLog[]> {
    const data = (await apiClient.get(
      API_ENDPOINTS.DASHBOARD.LOGS
    )) as BackendLogsResult;

    return normalizeLogsResponse(data);
  },
};

export const dashboardQueryKeys = {
  all: QUERY_KEYS.DASHBOARD,
  logs: () => [...QUERY_KEYS.DASHBOARD, "logs"] as const,
};
