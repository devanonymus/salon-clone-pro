export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api-production-6aa5.up.railway.app";

export type SalonSession = {
  user?: {
    id?: string;
    username?: string;
    role?: string;
  };
  tenant?: {
    id?: string;
    name?: string;
    code?: string;
  };
};

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("salonpro_token") || localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("salonpro_token", token);
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("salonpro_token");
  localStorage.removeItem("token");
  localStorage.removeItem("salonpro_session");
}

function parseResponse(text: string) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Backward-compatible default while legacy pages are migrated to typed responses.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiFetch<T = any>(path: string, options: RequestInit = {}) {
  const token = getToken();

  if (!token) {
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Token mancante");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  const data = parseResponse(text);

  if (res.status === 401 && typeof window !== "undefined") {
    clearToken();
    window.location.href = "/login";
  }

  if (!res.ok) {
    const msg =
      typeof data === "object" && data && "message" in data
        ? typeof data.message === "object"
          ? JSON.stringify(data.message)
          : String(data.message)
        : "";

    throw new Error(msg || text || "Errore API");
  }

  return data as T;
}

export async function loginApi(input: {
  tenantCode: string;
  username: string;
  pin: string;
}) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const text = await res.text();
  const data = parseResponse(text) as (SalonSession & { token?: string; message?: string }) | null;

  if (!res.ok) {
    throw new Error(data?.message || "Login non valido");
  }

  if (!data?.token) {
    throw new Error("Token non ricevuto");
  }

  setToken(data.token);
  localStorage.setItem(
    "salonpro_session",
    JSON.stringify({ user: data.user, tenant: data.tenant }),
  );
  window.dispatchEvent(new Event("salonpro-session"));

  return data;
}
