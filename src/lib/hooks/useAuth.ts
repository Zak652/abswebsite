"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authService } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/authStore";
import type { LoginFormData, RegisterFormData } from "@/types/auth";

export function useLogin() {
  const { setAccessToken, setUser } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginFormData) =>
      authService.login(data).then((r) => r.data),
    onSuccess: (data) => {
      setAccessToken(data.access);
      setUser(data.user);
      router.push("/portal");
    },
  });
}

export function useRegister() {
  const { setAccessToken, setUser } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterFormData) =>
      authService.register(data).then((r) => r.data),
    onSuccess: (data) => {
      setAccessToken(data.access);
      setUser(data.user);
      router.push("/portal");
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      logout();
      router.push("/");
    },
  });
}

/**
 * On mount, exchange the HttpOnly refresh cookie for a new access token so
 * a returning user with a persisted profile picks up where they left off.
 * Failure clears local state — a stale cookie shouldn't keep us authenticated.
 */
export function useRehydrateAuth() {
  const { setAccessToken, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;
    authService
      .refreshToken()
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

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) =>
      authService.requestPasswordReset(email).then((r) => r.data),
  });
}

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: (data: {
      token: string;
      new_password: string;
      new_password_confirm: string;
    }) =>
      authService
        .confirmPasswordReset(
          data.token,
          data.new_password,
          data.new_password_confirm,
        )
        .then((r) => r.data),
  });
}

export function useResendEmailVerification() {
  return useMutation({
    mutationFn: () =>
      authService.resendEmailVerification().then((r) => r.data),
  });
}

export function useConfirmEmailVerification() {
  return useMutation({
    mutationFn: (token: string) =>
      authService.confirmEmailVerification(token).then((r) => r.data),
  });
}

export function useExportMyData() {
  return useMutation({
    mutationFn: () => authService.exportMyData().then((r) => r.data),
  });
}

export function useDeleteMyAccount() {
  const { logout } = useAuthStore();
  const router = useRouter();
  return useMutation({
    mutationFn: () => authService.deleteMyAccount().then((r) => r.data),
    onSuccess: () => {
      logout();
      router.push("/");
    },
  });
}
