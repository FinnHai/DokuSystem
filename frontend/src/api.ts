/** API-Client mit JWT-Handling und automatischem Token-Refresh. */
import { useAuthStore } from "./store";

const BASE = import.meta.env.VITE_API_URL ?? "";

async function rawRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const { accessToken } = useAuthStore.getState();
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(`${BASE}${path}`, { ...init, headers });
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  let res = await rawRequest(path, init);

  // Bei 401 einmal Refresh versuchen
  if (res.status === 401) {
    const refreshed = await useAuthStore.getState().refresh();
    if (refreshed) {
      res = await rawRequest(path, init);
    } else {
      useAuthStore.getState().logout();
      throw new Error("Sitzung abgelaufen, bitte erneut anmelden");
    }
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Fehler ${res.status}`);
  }
  if (res.headers.get("content-type")?.includes("application/pdf")) {
    return (await res.blob()) as T;
  }
  return (await res.json()) as T;
}

export const apiBase = BASE;
