import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { DemoUser } from "../types";
import { clearStoredAuth, getStoredAuth, loginWithCredentials, setStoredAuth } from "../lib/api";

type AuthContextValue = {
  user: DemoUser | null;
  login: (email: string, password: string) => Promise<DemoUser>;
  logout: () => void;
  isAuthenticating: boolean;
  authError: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const storedAuth = getStoredAuth();
    if (storedAuth) {
      setUser(storedAuth.user);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const payload = await loginWithCredentials(email, password);
      setStoredAuth(payload);
      setUser(payload.user);
      return payload.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setAuthError(message);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAuthError(null);
    clearStoredAuth();
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticating,
      authError,
    }),
    [authError, isAuthenticating, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
