import { apiClient } from "./client";
import type { AuthTokens, LoginFormData, RegisterFormData, User } from "@/types/auth";

export const authService = {
  register: (
    data: RegisterFormData
  ) => apiClient.post<AuthTokens>("/auth/register/", data),

  login: (data: LoginFormData) =>
    apiClient.post<AuthTokens>("/auth/login/", data),

  logout: (refreshToken: string) =>
    apiClient.post("/auth/logout/", { refresh: refreshToken }),

  refreshToken: (refresh: string) =>
    apiClient.post<{ access: string }>("/auth/token/refresh/", { refresh }),

  me: () => apiClient.get<User>("/auth/me/"),
};
