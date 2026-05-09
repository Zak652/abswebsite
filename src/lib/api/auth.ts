import { apiClient } from "./client";
import type {
  AuthTokens,
  LoginFormData,
  RegisterFormData,
  User,
} from "@/types/auth";

export const authService = {
  register: (data: RegisterFormData) =>
    apiClient.post<AuthTokens>("/auth/register/", data),

  login: (data: LoginFormData) =>
    apiClient.post<AuthTokens>("/auth/login/", data),

  // Refresh token cookie carries auth; no body needed.
  logout: () => apiClient.post("/auth/logout/", {}),

  // Refresh token cookie is sent automatically (withCredentials: true).
  refreshToken: () =>
    apiClient.post<{ access: string }>("/auth/token/refresh/", {}),

  me: () => apiClient.get<User>("/auth/me/"),
};
