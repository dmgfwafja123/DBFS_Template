const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function getMetalPrices() {
  return request("/metals/prices");
}

export function buyMetal({ metal, quantityOz }) {
  return request("/precious-metals/buy", {
    method: "POST",
    body: JSON.stringify({ metal, quantityOz }),
  });
}