import { auth } from "./auth";

const BASE = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const token = auth.getToken();

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Erro na requisição");
  return data;
}

export const api = {
  login: (body) => request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),

  listProducts: (sector) => request(sector ? `/api/products?sector=${encodeURIComponent(sector)}` : "/api/products"),
  createProduct: (body) => request("/api/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id, body) => request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: "DELETE" }),

  listEntries: () => request("/api/entries"),
  createEntry: (body) => request("/api/entries", { method: "POST", body: JSON.stringify(body) }),

  listExits: () => request("/api/exits"),
  createExit: (body) => request("/api/exits", { method: "POST", body: JSON.stringify(body) })
};

export async function downloadFile(path, filename) {
  const token = auth.getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Falha ao baixar arquivo");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
