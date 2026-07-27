import apiClient from "@/lib/axios";
import { API_ENDPOINTS, QUERY_KEYS } from "@/shared/constants";
import type { CourseDocument, DocumentListParams, PaginatedDocuments, UploadDocumentPayload } from "./types";

interface BackendListResult {
  data?: CourseDocument[];
  documents?: CourseDocument[];
  meta?: PaginatedDocuments["meta"];
  pagination?: PaginatedDocuments["meta"];
  result?: {
    data?: CourseDocument[];
    meta?: PaginatedDocuments["meta"];
  };
}

interface BackendDocResult {
  data?: CourseDocument;
  document?: CourseDocument;
  result?: {
    data?: CourseDocument;
    document?: CourseDocument;
  };
}

function normalizeListResponse(payload: BackendListResult): PaginatedDocuments {
  const body = payload.result ?? payload;
  const data = body.data ?? payload.documents ?? [];
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

function normalizeDocResponse(payload: BackendDocResult): CourseDocument {
  const body = payload.result ?? payload;
  const doc = body.data ?? body.document ?? payload.document ?? payload.data;

  if (!doc) {
    throw new Error("Invalid document response from server");
  }

  return doc;
}

function buildListQuery(params: DocumentListParams) {
  const query = new URLSearchParams();

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.courseId) query.set("courseId", params.courseId);
  if (params.fileType) query.set("fileType", params.fileType);
  if (params.version?.trim()) query.set("version", params.version.trim());
  if (params.uploadedBy?.trim()) query.set("uploadedBy", params.uploadedBy.trim());
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export const documentService = {
  async list(params: DocumentListParams = {}): Promise<PaginatedDocuments> {
    const data = (await apiClient.get(
      `${API_ENDPOINTS.DOCUMENTS.LIST}${buildListQuery(params)}`,
    )) as BackendListResult;

    return normalizeListResponse(data);
  },

  async upload(payload: UploadDocumentPayload, _uploaderEmail = "admin@academy.edu"): Promise<CourseDocument> {
    const data = (await apiClient.post(
      API_ENDPOINTS.DOCUMENTS.UPLOAD,
      payload,
    )) as BackendDocResult;

    return normalizeDocResponse(data);
  },

  async toggleActive(id: string): Promise<CourseDocument> {
    const data = (await apiClient.patch(
      API_ENDPOINTS.DOCUMENTS.UPDATE_STATUS(id),
    )) as BackendDocResult;

    return normalizeDocResponse(data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.DOCUMENTS.DELETE(id));
  },
};

export const documentQueryKeys = {
  all: QUERY_KEYS.DOCUMENTS,
  list: (params: DocumentListParams) => [...QUERY_KEYS.DOCUMENTS, "list", params] as const,
};
