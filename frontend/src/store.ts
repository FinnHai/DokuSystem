import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser } from "./types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  refresh: () => Promise<boolean>;
  logout: () => void;
}

const BASE = import.meta.env.VITE_API_URL ?? "";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      login: async (email, password) => {
        const res = await fetch(`${BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Anmeldung fehlgeschlagen");
        }
        const data = await res.json();
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      },

      refresh: async () => {
        const token = get().refreshToken;
        if (!token) return false;
        const res = await fetch(`${BASE}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: token }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
        return true;
      },

      logout: () => {
        const token = get().refreshToken;
        if (token) {
          void fetch(`${BASE}/api/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: token }),
          });
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    { name: "besidoc-auth" }
  )
);

interface ToastState {
  toasts: { id: number; type: "success" | "error" | "info"; text: string }[];
  push: (type: "success" | "error" | "info", text: string) => void;
  remove: (id: number) => void;
}

let toastId = 0;
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (type, text) => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, type, text }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 5000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
