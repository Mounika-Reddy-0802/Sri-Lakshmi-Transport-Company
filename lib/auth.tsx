"use client";
// Session state for the whole app.
//
// On first paint the provider tries a silent refresh: the access token lives
// only in memory, so a page reload has none — but the httpOnly refresh cookie
// survives, and exchanging it restores the session without a second login.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api, restoreSession, setAccessToken, type LoginResponse, type Role, type SessionUser } from "./api";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthValue = {
  user: SessionUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  status: "loading",
  login: async () => {
    throw new Error("AuthProvider is missing");
  },
  logout: async () => undefined,
});

/** Where each role lands after signing in. */
export const HOME_FOR_ROLE: Record<Role, string> = {
  admin: "/admin",
  org: "/organization",
  student: "/student",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const restored = await restoreSession();
      if (cancelled) return;

      if (!restored) {
        setStatus("unauthenticated");
        return;
      }

      try {
        const me = await api.get<SessionUser>("/auth/me");
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      } catch {
        if (!cancelled) setStatus("unauthenticated");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await api.post<LoginResponse>("/auth/login", { email, password });
      setAccessToken(result.accessToken);
      setUser(result.user);
      setStatus("authenticated");
      return result.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if the call fails the local session must still be dropped.
    }
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
    // Otherwise the next user to sign in briefly sees the previous one's data.
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthValue>(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/**
 * Route guard. Renders nothing until the session is known, then either the
 * children, a redirect to /login, or a redirect to the caller's own portal if
 * they hold the wrong role.
 */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && user && !roles.includes(user.role)) {
      router.replace(HOME_FOR_ROLE[user.role]);
    }
  }, [status, user, roles, router]);

  if (status !== "authenticated" || !user || !roles.includes(user.role)) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}

export function FullPageLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-fog dark:bg-[#0f1820]">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-steel" />
        <span className="text-sm text-muted2">Loading your portal…</span>
      </div>
    </div>
  );
}

export function useLogout() {
  const { logout } = useAuth();
  const router = useRouter();
  return useCallback(async () => {
    await logout();
    router.replace("/login");
  }, [logout, router]);
}
