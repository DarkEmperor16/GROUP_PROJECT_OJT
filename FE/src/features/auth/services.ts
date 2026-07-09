import apiClient from "@/lib/axios";
import { API_ENDPOINTS } from "@/shared/constants";
import type { LoginRequest, LoginResponse } from "@/features/auth/types";
import { extractTokenPair } from "@/features/auth/utils/tokenResponse";

interface BackendLoginResult {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  user?: LoginResponse["user"];
  result?: BackendLoginResult;
  data?: BackendLoginResult;
}

function normalizeLoginResponse(data: BackendLoginResult): LoginResponse {
  const payload = data.result ?? data.data ?? data;
  const { accessToken, refreshToken } = extractTokenPair(data);
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

  async getMe(): Promise<LoginResponse["user"]> {
    const data = (await apiClient.get(API_ENDPOINTS.AUTH.ME)) as {
      user?: LoginResponse["user"];
    };

    if (!data.user) {
      throw new Error("Invalid session response from server");
    }

    return data.user;
  },
};

/** @deprecated Use authService */
export const authApi = authService;
