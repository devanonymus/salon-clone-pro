const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("salonpro_token");
}

export function setToken(token: string) {
  localStorage.setItem("salonpro_token", token);
}

export function clearToken() {
  localStorage.removeItem("salonpro_token");
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();

  if (!token) {
    window.location.href = "/login";
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
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.message || text || "Errore API");
  }

  return data;
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

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Login non valido");
  }

  setToken(data.token);

  return data;
}