"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, clearSession, getStoredUser, getToken, setSession } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    const token = getToken();
    if (!token || !storedUser) {
      setLoading(false);
      return;
    }

    setUser(storedUser);
    authApi
      .me()
      .then(({ user: freshUser }) => {
        setUser(freshUser);
        setSession(token, freshUser);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(loginValue, password) {
    const { token, user: nextUser } = await authApi.login({ login: loginValue, password });
    setSession(token, nextUser);
    setUser(nextUser);
    router.push("/solicitudes/ingresar");
  }

  function logout() {
    clearSession();
    setUser(null);
    router.push("/login");
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      canAccess: (pathname) => {
        if (!user?.menu) return false;
        if (pathname.startsWith("/solicitudes")) {
          return user.menu.some((item) => item.nombre === "Solicitudes");
        }
        return user.menu.some((item) => pathname === item.ruta || pathname.startsWith(`${item.ruta}/`));
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
