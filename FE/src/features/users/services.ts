import apiClient from "@/lib/axios";
import { API_ENDPOINTS, QUERY_KEYS } from "@/shared/constants";
import type {
  CreateUserPayload,
  ManagedUser,
  PaginatedUsers,
  UpdateUserPayload,
  UserListParams,
  UserStatus,
} from "@/features/users/types";

interface BackendListResult {
  data?: ManagedUser[];
  users?: ManagedUser[];
  meta?: PaginatedUsers["meta"];
  pagination?: PaginatedUsers["meta"];
  result?: {
    data?: ManagedUser[];
    meta?: PaginatedUsers["meta"];
  };
}

interface BackendUserResult {
  data?: ManagedUser;
  user?: ManagedUser;
  result?: {
    data?: ManagedUser;
    user?: ManagedUser;
  };
}

function normalizeListResponse(payload: BackendListResult): PaginatedUsers {
  const body = payload.result ?? payload;
  const data = body.data ?? payload.users ?? [];
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

function normalizeUserResponse(payload: BackendUserResult): ManagedUser {
  const body = payload.result ?? payload;
  const user = body.data ?? body.user ?? payload.user ?? payload.data;

  if (!user) {
    throw new Error("Invalid user response from server");
  }

  return user;
}

function buildListQuery(params: UserListParams) {
  const query = new URLSearchParams();

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.role) query.set("role", params.role);
  if (params.status) query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export const userService = {
  async list(params: UserListParams = {}): Promise<PaginatedUsers> {
    const data = (await apiClient.get(
      `${API_ENDPOINTS.USERS.LIST}${buildListQuery(params)}`,
    )) as BackendListResult;

    return normalizeListResponse(data);
  },

  async create(payload: CreateUserPayload): Promise<ManagedUser> {
    const data = (await apiClient.post(
      API_ENDPOINTS.USERS.CREATE,
      payload,
    )) as BackendUserResult;

    return normalizeUserResponse(data);
  },

  async update(id: string, payload: UpdateUserPayload): Promise<ManagedUser> {
    const data = (await apiClient.put(
      API_ENDPOINTS.USERS.UPDATE(id),
      payload,
    )) as BackendUserResult;

    return normalizeUserResponse(data);
  },

  async updateStatus(id: string, status: UserStatus): Promise<ManagedUser> {
    const data = (await apiClient.patch(
      API_ENDPOINTS.USERS.UPDATE_STATUS(id),
      { status },
    )) as BackendUserResult;

    return normalizeUserResponse(data);
  },

  async lock(id: string): Promise<ManagedUser> {
    const data = (await apiClient.patch(
      API_ENDPOINTS.USERS.LOCK(id),
    )) as BackendUserResult;

    return normalizeUserResponse(data);
  },

  async unlock(id: string): Promise<ManagedUser> {
    const data = (await apiClient.patch(
      API_ENDPOINTS.USERS.UNLOCK(id),
    )) as BackendUserResult;

    return normalizeUserResponse(data);
  },

  async delete(id: string): Promise<ManagedUser> {
    const data = (await apiClient.delete(
      API_ENDPOINTS.USERS.DELETE(id),
    )) as BackendUserResult;

    return normalizeUserResponse(data);
  },

  async restore(id: string): Promise<ManagedUser> {
    const data = (await apiClient.patch(
      API_ENDPOINTS.USERS.RESTORE(id),
    )) as BackendUserResult;

    return normalizeUserResponse(data);
  },

  async resetPassword(id: string, password: string): Promise<ManagedUser> {
    const data = (await apiClient.patch(
      API_ENDPOINTS.USERS.RESET_PASSWORD(id),
      { password },
    )) as BackendUserResult;

    return normalizeUserResponse(data);
  },

  async assignRole(id: string, role: string): Promise<ManagedUser> {
    const data = (await apiClient.patch(
      API_ENDPOINTS.USERS.ASSIGN_ROLE(id),
      { role },
    )) as BackendUserResult;

    return normalizeUserResponse(data);
  },

  async listRoles(): Promise<{ data: any[] }> {
    return apiClient.get(API_ENDPOINTS.ROLES.LIST);
  },

  async createRole(payload: { name: string; description?: string; permissions?: string[] }): Promise<any> {
    return apiClient.post(API_ENDPOINTS.ROLES.CREATE, payload);
  },

  async getRole(id: string): Promise<any> {
    return apiClient.get(API_ENDPOINTS.ROLES.GET(id));
  },

  async updateRole(id: string, payload: { name?: string; description?: string }): Promise<any> {
    return apiClient.put(API_ENDPOINTS.ROLES.UPDATE(id), payload);
  },

  async deleteRole(id: string): Promise<any> {
    return apiClient.delete(API_ENDPOINTS.ROLES.DELETE(id));
  },

  async listPermissions(): Promise<{ data: any[] }> {
    return apiClient.get(API_ENDPOINTS.PERMISSIONS.LIST);
  },

  async assignPermissions(roleId: string, permissions: string[]): Promise<any> {
    return apiClient.put(API_ENDPOINTS.ROLES.ASSIGN_PERMISSIONS(roleId), { permissions });
  },
};

export const userQueryKeys = {
  all: QUERY_KEYS.USERS,
  list: (params: UserListParams) =>
    [...QUERY_KEYS.USERS, "list", params] as const,
};