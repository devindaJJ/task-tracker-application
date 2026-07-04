import { apiClient } from "./client";
import type { TokenPair, User } from "../types";

export interface RegisterInput {
  email: string;
  full_name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  register: (input: RegisterInput) =>
    apiClient.post<User>("/api/v1/auth/register", input).then((r) => r.data),

  login: (input: LoginInput) =>
    apiClient.post<TokenPair>("/api/v1/auth/login", input).then((r) => r.data),

  me: () => apiClient.get<User>("/api/v1/users/me").then((r) => r.data),
};
