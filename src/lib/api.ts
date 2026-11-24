// In-memory session token (never stored in localStorage/sessionStorage; paired with HttpOnly cookie)
let memorySessionToken: string | null = null;

export function setClientSessionToken(token: string | null): void {
  memorySessionToken = token;
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('X-Requested-With', 'XMLHttpRequest');
  if (memorySessionToken) {
    headers.set('Authorization', `Bearer ${memorySessionToken}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data?.error === 'string' ? data.error : 'Something went wrong. Please try again.';
    throw new Error(message);
  }
  return data as T;
}
