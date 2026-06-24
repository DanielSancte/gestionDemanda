const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:4001";
const SOLICITUDES_API_URL = process.env.NEXT_PUBLIC_SOLICITUDES_API_URL || "http://localhost:4002";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("gestion_token");
}

export function setSession(token, user) {
  window.localStorage.setItem("gestion_token", token);
  window.localStorage.setItem("gestion_user", JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem("gestion_token");
  window.localStorage.removeItem("gestion_user");
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem("gestion_user");
  return value ? JSON.parse(value) : null;
}

async function request(baseUrl, path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Error de comunicacion con el servicio");
  }
  return data;
}

export const authApi = {
  login: (payload) =>
    request(AUTH_API_URL, "/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  me: () => request(AUTH_API_URL, "/auth/me")
};

export const solicitudesApi = {
  catalogos: () => request(SOLICITUDES_API_URL, "/catalogos"),
  pendientes: (rutUsuario) =>
    request(SOLICITUDES_API_URL, `/solicitudes/pendientes?rutUsuario=${encodeURIComponent(rutUsuario)}`),
  listar: (filters) => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return request(SOLICITUDES_API_URL, `/solicitudes${suffix}`);
  },
  crear: (payload) =>
    request(SOLICITUDES_API_URL, "/solicitudes", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
