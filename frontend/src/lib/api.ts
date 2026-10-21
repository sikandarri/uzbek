import type { ApiEnvelope } from '../../../shared/src/contracts';
export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    public requestId?: string,
  ) {
    super(code);
  }
}
let csrfToken: string | null = null;
let pending: Promise<string> | null = null;
async function bootstrap(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (!pending)
    pending = request<{ csrfToken: string }>('/auth/csrf')
      .then((v) => (csrfToken = v.csrfToken))
      .finally(() => {
        pending = null;
      });
  return pending;
}
export function setCsrf(value: string | null) {
  csrfToken = value;
}
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method ?? 'GET',
    mutation = !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
  const headers = new Headers(options.headers);
  if (mutation) {
    headers.set('Content-Type', 'application/json');
    headers.set('X-CSRF-Token', await bootstrap());
  }
  let res: Response;
  try {
    res = await fetch('/api/v1' + path, {
      ...options,
      method,
      headers,
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError('NETWORK_ERROR', 0);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({ error: { code: 'INTERNAL_ERROR' } }));
  if (!res.ok) {
    if (res.status === 401 || body.error?.code === 'CSRF_REJECTED') csrfToken = null;
    throw new ApiError(body.error?.code ?? 'UNKNOWN', res.status, body.error?.requestId);
  }
  return (body as ApiEnvelope<T>).data;
}
