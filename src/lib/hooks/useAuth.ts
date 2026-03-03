"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authService } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/authStore";
import type { LoginFormData, RegisterFormData } from "@/types/auth";

export function useLogin() {
  const { setTokens, setUser } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginFormData) =>
      authService.login(data).then((r) => r.data),
    onSuccess: (data) => {
      setTokens(data.access, data.refresh);
      setUser(data.user);
      router.push("/portal");
    },
  });
}

export function useRegister() {
  const { setTokens, setUser } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterFormData) =>
      authService.register(data).then((r) => r.data),
    onSuccess: (data) => {
      setTokens(data.access, data.refresh);
      setUser(data.user);
      router.push("/portal");
    },
  });
}

export function useLogout() {
  const { logout, refreshToken } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) await authService.logout(refreshToken);
    },
    onSettled: () => {
      logout();
      router.push("/");
    },
  });
}

export function useRehydrateAuth() {
  const { setAccessToken, refreshToken, isAuthenticated, logout } =
    useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !refreshToken) return;
    authService
      .refreshToken(refreshToken)
      .then((r) => setAccessToken(r.data.access))
      .catch(() => logout());
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authService.me().then((r) => r.data),
    enabled: isAuthenticated,
  });
}
