import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "../auth/tokenStorage";
import type { TokenPair } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the current access token to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Automatic refresh-on-401 ---
//
// If multiple requests fail with 401 at roughly the same time (e.g. a page
// that fires 3 requests on load, all using an expired token), we don't want
// to fire 3 separate refresh calls. `refreshPromise` is shared so the first
// failing request kicks off the refresh, and the others just await the same
// in-flight promise.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await axios.post<TokenPair>(`${API_BASE_URL}/api/v1/auth/refresh`, {
    refresh_token: refreshToken,
  });

  tokenStorage.setTokens(response.data.access_token, response.data.refresh_token);
  return response.data.access_token;
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    const isAuthEndpoint = originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && originalRequest && !originalRequest._retried && !isAuthEndpoint) {
      originalRequest._retried = true;

      try {
        refreshPromise ??= refreshAccessToken();
        const newAccessToken = await refreshPromise;
        refreshPromise = null;

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        tokenStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
