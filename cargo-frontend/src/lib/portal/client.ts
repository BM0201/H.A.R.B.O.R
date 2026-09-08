"use client";

/**
 * HARBOR PASO U.1 — cliente HTTP del portal. NO usa `apiFetch` (ese adjunta el
 * CSRF del staff y asume sesión de staff). El portal usa su cookie propia
 * (`__Host-cargo_portal_session`, SameSite=strict) y no necesita CSRF.
 */
export async function portalFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: T | null; error?: { code?: string; message?: string } }> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* respuesta sin cuerpo */
  }
  const b = body as { ok?: boolean; data?: T; error?: { code?: string; message?: string } } | null;
  return {
    ok: res.ok && b?.ok !== false,
    status: res.status,
    data: (b?.data ?? null) as T | null,
    error: b?.error,
  };
}
