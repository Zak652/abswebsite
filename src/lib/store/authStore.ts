import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types/auth";

/**
 * Auth store. Refresh tokens live in an HttpOnly cookie on the backend
 * (see backend/apps/accounts/views.py — abs_refresh) and are never visible
 * to JavaScript. Only the access token is held client-side, in memory.
 *
 * Persisted to sessionStorage: user profile + isAuthenticated flag, so the
 * UI can hydrate without a network round-trip. The access token is *not*
 * persisted — on reload we hit /auth/token/refresh/ which reads the cookie.
 */
interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: User) => void;
  setAuthenticated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,

      setAccessToken: (token) =>
        set({ accessToken: token, isAuthenticated: !!token }),

      setUser: (user) => set({ user, isAuthenticated: true }),

      setAuthenticated: (value) => set({ isAuthenticated: value }),

      logout: () =>
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "abs-auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? sessionStorage
          : {
              getItem: () => null,
              setItem: () => { },
              removeItem: () => { },
            }
      ),
      // Only the user profile + flag are persisted. Access token is in-memory
      // only; refresh token never touches storage (lives in HttpOnly cookie).
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
