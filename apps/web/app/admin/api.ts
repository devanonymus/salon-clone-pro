export async function platform<T = Record<string, unknown>>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const response = await fetch(`/platform/${path}`, {
    method: method || (body ? "POST" : "GET"),
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response
    .json()
    .catch(() => ({ message: "Servizio amministrativo non disponibile" }));
  if (!response.ok) {
    if (
      response.status === 401 &&
      !path.startsWith("auth/") &&
      typeof window !== "undefined"
    )
      window.location.replace("/admin/login");
    throw new Error(
      Array.isArray(data.message)
        ? data.message.join("; ")
        : data.message || "Operazione non riuscita",
    );
  }
  return data;
}
export type Admin = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  assignments?: { tenantId: string }[];
};
export type Salon = {
  id: string;
  name: string;
  code: string;
  salonProfile: Record<string, string> | null;
  technicianAssignments: { admin: Admin }[];
};
