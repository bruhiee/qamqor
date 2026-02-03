type ApiOptions = RequestInit & {
  skipAuth?: boolean;
  absolute?: boolean;
};

const TOKEN_KEY = "disease-detector-token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}) {
  const { skipAuth, absolute, headers: customHeaders, ...rest } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...Object.fromEntries(
      Object.entries(customHeaders || {}).map(([key, value]) => [
        key,
        value?.toString() ?? "",
      ]),
    ),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const url = absolute ? path : `/api${path}`;
  const response = await fetch(url, {
    ...rest,
    headers,
    body: rest.body && typeof rest.body !== "string" ? JSON.stringify(rest.body) : rest.body,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = payload?.message || payload?.error || response.statusText;
    throw new Error(errorMessage || "Request failed");
  }

  return payload as T;
}
