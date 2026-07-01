import type { AuthUser } from "../components/auth/AuthModal";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/vsecure-api" : "http://localhost:4500");
const TOKEN_KEY = "vsecure-review-token";
const USER_KEY = "vsecure-review-user";

type AuthResponse = {
  token: string;
  user: AuthUser;
};

async function authRequest(path: string, body?: unknown, token?: string | null) {
  const response = await fetch(`${API_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "request_failed" }));
    throw new Error(payload.error ?? "request_failed");
  }

  return response.status === 204 ? null : response.json();
}

export async function register(input: { firstName: string; lastName: string; email: string; password: string }) {
  return (await authRequest("/auth/register", input)) as AuthResponse;
}

export async function login(input: { email: string; password: string }) {
  return (await authRequest("/auth/login", input)) as AuthResponse;
}

export async function fetchMe() {
  const token = getStoredToken();
  if (!token) {
    return null;
  }

  const payload = (await authRequest("/auth/me", undefined, token)) as { user: AuthUser };
  return payload.user;
}

export async function logout() {
  const token = getStoredToken();
  if (token) {
    await authRequest("/auth/logout", {}, token).catch(() => null);
  }
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function saveAuthSession(response: AuthResponse) {
  window.localStorage.setItem(TOKEN_KEY, response.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(response.user));
}

export function loadStoredAuthUser(): AuthUser | null {
  try {
    const saved = window.localStorage.getItem(USER_KEY);
    return saved ? (JSON.parse(saved) as AuthUser) : null;
  } catch {
    return null;
  }
}

function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}
