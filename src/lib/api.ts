const SESSION_KEY = 'aura_session_token';
const AUTH_TOKEN_KEY = 'aura_auth_token';

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function hasAuthToken() {
  return Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
}

export function getSessionToken(): string {
  let token = localStorage.getItem(SESSION_KEY);
  if (!token) {
    token = 'guest_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, token);
  }
  return token;
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});

  // Append guest session token
  const sessionToken = getSessionToken();
  headers.set('x-session-token', sessionToken);

  const authToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  // Ensure JSON Content-Type if sending JSON body
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}
