const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api-production-6aa5.up.railway.app";

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
    const msg =
      typeof data?.message === "object"
        ? JSON.stringify(data.message)
        : data?.message;

    throw new Error(msg || text || "Errore API");
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

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.message || "Login non valido");
  }

  if (!data?.token) {
    throw new Error("Token non ricevuto");
  }

  setToken(data.token);

  return data;
}