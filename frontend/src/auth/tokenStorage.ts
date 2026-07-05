/**
 * Centralizes token storage so the whole app reads/writes tokens through
 * one module. This makes it a one-line change later to swap localStorage
 * for an httpOnly cookie + in-memory access token (the more secure setup
 * for production -- see README "Assumptions").
 *
 * Tradeoff we're making here: storing the refresh token in localStorage is
 * vulnerable to XSS (a malicious script could read it). It's acceptable for
 * this assignment's scope, but documented explicitly rather than silently
 * assumed.
 */
const ACCESS_TOKEN_KEY = "task_tracker_access_token";
const REFRESH_TOKEN_KEY = "task_tracker_refresh_token";

export const tokenStorage = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),

  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clear: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
