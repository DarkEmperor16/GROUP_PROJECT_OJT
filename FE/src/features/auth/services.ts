import apiClient from "@/lib/axios";
import { API_ENDPOINTS } from "@/shared/constants";
import type { LoginRequest, LoginResponse } from "@/features/auth/types";

interface BackendLoginResult {
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  user?: LoginResponse["user"];
  result?: {
    accessToken?: string;
    refreshToken?: string;
    access_token?: string;
    refresh_token?: string;
    user?: LoginResponse["user"];
  };
  data?: {
    accessToken?: string;
    refreshToken?: string;
    access_token?: string;
    refresh_token?: string;
    user?: LoginResponse["user"];
  };
}

function normalizeLoginResponse(data: BackendLoginResult): LoginResponse {
  const payload = data.result ?? data.data ?? data;

  const accessToken =
    payload.accessToken ?? payload.access_token ?? data.accessToken ?? "";
  const refreshToken =
    payload.refreshToken ?? payload.refresh_token ?? data.refreshToken ?? "";
  const user = payload.user ?? data.user;

  if (!accessToken || !user) {
    throw new Error("Invalid login response from server");
  }

  return {
    accessToken,
    refreshToken,
    user,
  };
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const data = (await apiClient.post(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    )) as BackendLoginResult;
    return normalizeLoginResponse(data);
  },

  async logout(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  },
};

/** @deprecated Use authService */
export const authApi = authService;
