import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Lazy-load the auth store to avoid circular deps and SSR issues
const getAuthStore = () => {
  if (typeof window === "undefined") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@/lib/store/authStore").useAuthStore;
  } catch {
    return null;
  }
};

// Request interceptor: attach access token from in-memory Zustand store
apiClient.interceptors.request.use((config) => {
  const store = getAuthStore();
  if (store) {
    const token = store.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: on 401 → call /auth/token/refresh/ which reads the
// HttpOnly refresh cookie server-side → retry original request.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      // Don't loop if the refresh endpoint itself returned 401.
      !original.url?.includes("/auth/token/refresh/")
    ) {
      original._retry = true;
      try {
        const res = await axios.post(
          `${API_BASE_URL}/auth/token/refresh/`,
          {},
          { withCredentials: true },
        );
        const newAccess: string = res.data.access;
        const store = getAuthStore();
        if (store) {
          store.getState().setAccessToken(newAccess);
        }
        original.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(original);
      } catch {
        const store = getAuthStore();
        if (store) {
          store.getState().logout();
        }
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }
    }
    return Promise.reject(error);
  }
);
