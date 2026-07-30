import axios, { AxiosHeaders } from "axios";
import { useAuthStore } from "@/features/auth/store";
import { extractTokenPair } from "@/features/auth/utils/tokenResponse";
import { API_ENDPOINTS } from "@/shared/constants";

const AUTH_SKIP_REFRESH_PATHS = [
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.REFRESH,
  API_ENDPOINTS.AUTH.LOGOUT,
] as const;

function shouldSkipTokenRefresh(url?: string): boolean {
  if (!url) return false;
  return AUTH_SKIP_REFRESH_PATHS.some((path) => url.includes(path));
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 60000, // Tăng timeout lên 60 giây vì các API gọi AI thường mất nhiều thời gian
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const headers = AxiosHeaders.from(config.headers ?? {});

    const hasRequestBody = config.data !== undefined && config.data !== null;
    const isFormData = typeof FormData !== "undefined" && config.data instanceof FormData;

    if (isFormData) {
      headers.delete("Content-Type");
      headers.delete("content-type");
    }

    if (hasRequestBody && !isFormData) {
      const hasContentType = Boolean(headers.get("Content-Type") || headers.get("content-type"));

      if (!hasContentType) {
        headers.set("Content-Type", "application/json");
      }
    }

    config.headers = headers;

    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.set("Authorization", `Bearer ${accessToken}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !shouldSkipTokenRefresh(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        const storedRefreshToken = useAuthStore.getState().refreshToken;
        const baseURL = import.meta.env.VITE_API_URL || "/api";

        const response = await axios.post(
          `${baseURL}${API_ENDPOINTS.AUTH.REFRESH}`,
          storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
          { withCredentials: true },
        );

        const { accessToken, refreshToken: newRefreshToken } = extractTokenPair(
          response.data,
        );

        if (!accessToken) {
          throw new Error("Invalid refresh response");
        }

        const user = useAuthStore.getState().user;
        if (user) {
          useAuthStore
            .getState()
            .setAuth(accessToken, newRefreshToken || storedRefreshToken || "", user);
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
