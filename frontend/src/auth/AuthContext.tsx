import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, type LoginInput, type RegisterInput } from "../api/auth";
import { tokenStorage } from "./tokenStorage";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Starts true because on first mount we don't yet know if a stored token
  // is still valid -- the app should show a loading state, not flash the
  // login page, while we check.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hasToken = Boolean(tokenStorage.getAccessToken());
    if (!hasToken) {
      setIsLoading(false);
      return;
    }

    authApi
      .me()
      .then(setUser)
      .catch(() => {
        // Access token expired and refresh also failed (the axios
        // interceptor already redirected to /login in that case) --
        // nothing more to do here.
        tokenStorage.clear();
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(input: LoginInput) {
    const tokens = await authApi.login(input);
    tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
    const me = await authApi.me();
    setUser(me);
  }

  async function register(input: RegisterInput) {
    await authApi.register(input);
    await login({ email: input.email, password: input.password });
  }

  function logout() {
    tokenStorage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
