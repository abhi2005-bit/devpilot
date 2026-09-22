import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";

import {
  authService,
  type AuthResponse,
  type AuthUser,
} from "../services/authService";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    authResponse: AuthResponse,
    rememberMe: boolean,
  ) => void;
  logout: () => void;
};

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(
    null,
  );

  const [accessToken, setAccessToken] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken =
        authService.getStoredToken();

      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }

        return;
      }

      try {
        const currentUser =
          await authService.getCurrentUser(
            storedToken,
          );

        if (!isMounted) {
          return;
        }

        setAccessToken(storedToken);
        setUser(currentUser);
      } catch {
        authService.clearSession();

        if (!isMounted) {
          return;
        }

        setAccessToken(null);
        setUser(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = (
    authResponse: AuthResponse,
    rememberMe: boolean,
  ) => {
    authService.saveSession(
      authResponse,
      rememberMe,
    );

    setAccessToken(authResponse.access_token);
    setUser(authResponse.user);
  };

  const logout = () => {
    authService.clearSession();

    setAccessToken(null);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [
      user,
      accessToken,
      isLoading,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider.",
    );
  }

  return context;
}
