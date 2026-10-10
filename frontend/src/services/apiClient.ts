import { authService } from "./authService";

export async function responseError(
  response: Response,
  fallback: string,
): Promise<Error> {
  let detail = "";

  try {
    const payload: unknown = await response.json();
    if (
      payload &&
      typeof payload === "object" &&
      "detail" in payload &&
      typeof payload.detail === "string"
    ) {
      detail = payload.detail;
    }
  } catch {
    // Keep the fallback when the server did not return JSON.
  }

  return new Error(
    `${fallback} (HTTP ${response.status})${detail ? `: ${detail}` : ""}`,
  );
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = authService.getStoredToken();

  const headers = new Headers(init.headers);

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
