import axios from "axios";
import { useAuthStore } from "@/stores/auth.store";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
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

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error("No refresh token");

        const baseURL = import.meta.env.VITE_API_URL || "/api";
        const response = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data ?? response.data;

        const user = useAuthStore.getState().user;
        if (user) {
          useAuthStore.getState().setAuth(accessToken, newRefreshToken, user);
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
