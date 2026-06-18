export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const ROLE_HOME_PATH: Record<UserRole, string> = {
  STUDENT: "/student",
  TEACHER: "/teacher/dashboard",
  ADMIN: "/admin/dashboard",
};
