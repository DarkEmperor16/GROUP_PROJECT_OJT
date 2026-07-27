import type { UserRole } from "@/features/auth/types";

export type UserStatus = "ACTIVE" | "INACTIVE";

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  userCode: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserListParams {
  search?: string;
  role?: UserRole | "";
  status?: UserStatus | "";
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  data: ManagedUser[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  userCode: string;
  password: string;
  role: UserRole;
  status: UserStatus;
}

export interface UpdateUserPayload {
  fullName: string;
  email: string;
  userCode: string;
  role: UserRole;
  status: UserStatus;
}
