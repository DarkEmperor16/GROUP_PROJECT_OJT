import apiClient from "@/lib/axios";
import { API_ENDPOINTS, QUERY_KEYS } from "@/shared/constants";
import type { QaLog, QaListParams, PaginatedQaLogs } from "./types";

interface BackendListResult {
  data?: QaLog[];
  logs?: QaLog[];
  meta?: PaginatedQaLogs["meta"];
  pagination?: PaginatedQaLogs["meta"];
  result?: {
    data?: QaLog[];
    meta?: PaginatedQaLogs["meta"];
  };
}

function normalizeListResponse(payload: BackendListResult): PaginatedQaLogs {
  const body = payload.result ?? payload;
  const data = body.data ?? payload.logs ?? [];
  const meta = body.meta ?? payload.meta ?? payload.pagination;

  if (!meta) {
    return {
      data,
      meta: {
        page: 1,
        limit: data.length,
        total: data.length,
        totalPages: 1,
      },
    };
  }

  return { data, meta };
}

function buildListQuery(params: QaListParams) {
  const query = new URLSearchParams();

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.role) query.set("role", params.role);
  if (params.courseId) query.set("courseId", params.courseId);
  if (params.status) query.set("status", params.status);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export const qaService = {
  async list(params: QaListParams = {}): Promise<PaginatedQaLogs> {
    const data = (await apiClient.get(
      `${API_ENDPOINTS.QA.LIST}${buildListQuery(params)}`,
    )) as BackendListResult;

    return normalizeListResponse(data);
  },

  async listAllForExport(params: Omit<QaListParams, "page" | "limit"> = {}): Promise<QaLog[]> {
    const data = (await apiClient.get(
      `${API_ENDPOINTS.QA.LIST}/export${buildListQuery(params)}`,
    )) as { data: QaLog[] };

    return data.data ?? [];
  },
};

export const qaQueryKeys = {
  all: QUERY_KEYS.QA,
  list: (params: QaListParams) => [...QUERY_KEYS.QA, "list", params] as const,
};
