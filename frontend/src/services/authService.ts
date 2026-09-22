import API_URL_BASE from "../config/api";

const API_URL = `${API_URL_BASE}/auth`;

const ACCESS_TOKEN_KEY = "devpilot_access_token";
const USER_KEY = "devpilot_user";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

type BackendError = {
  detail?: string;
};

async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data: BackendError = await response.json();

    if (typeof data.detail === "string") {
      return data.detail;
    }
  } catch {
    // Ignore JSON parsing errors and use the fallback message.
  }

  return fallback;
}

export const authService = {
  async login(
    credentials: LoginRequest,
  ): Promise<AuthResponse> {
    const response = await fetch(
      `${API_URL}/login`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(credentials),
      },
    );

    if (!response.ok) {
      const message = await getErrorMessage(
        response,
        "Failed to log in",
      );

      throw new Error(message);
    }

    return response.json();
  },

  async register(
    data: RegisterRequest,
  ): Promise<AuthResponse> {
    const response = await fetch(
      `${API_URL}/register`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const message = await getErrorMessage(
        response,
        "Failed to create account",
      );

      throw new Error(message);
    }

    return response.json();
  },

  async getCurrentUser(
    accessToken: string,
  ): Promise<AuthUser> {
    const response = await fetch(
      `${API_URL}/me`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const message = await getErrorMessage(
        response,
        "Failed to load current user",
      );

      throw new Error(message);
    }

    return response.json();
  },

  saveSession(
    data: AuthResponse,
    rememberMe: boolean,
  ): void {
    const targetStorage = rememberMe
      ? localStorage
      : sessionStorage;

    const otherStorage = rememberMe
      ? sessionStorage
      : localStorage;

    otherStorage.removeItem(ACCESS_TOKEN_KEY);
    otherStorage.removeItem(USER_KEY);

    targetStorage.setItem(
      ACCESS_TOKEN_KEY,
      data.access_token,
    );

    targetStorage.setItem(
      USER_KEY,
      JSON.stringify(data.user),
    );
  },

  getStoredToken(): string | null {
    return (
      localStorage.getItem(ACCESS_TOKEN_KEY) ??
      sessionStorage.getItem(ACCESS_TOKEN_KEY)
    );
  },

  getStoredUser(): AuthUser | null {
    const rawUser =
      localStorage.getItem(USER_KEY) ??
      sessionStorage.getItem(USER_KEY);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      return null;
    }
  },

  clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};
