const API_BASE = "/api";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `API ${res.status}`);
  }

  return res.json();
}

export async function checkHealth(): Promise<{
  ok: boolean;
  hasKey: boolean;
}> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  } catch {
    return { ok: false, hasKey: false };
  }
}

export { post };
