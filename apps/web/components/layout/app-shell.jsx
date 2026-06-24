"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BarChart3,
  CalendarDays,
  LogOut,
  Megaphone,
  Settings,
  ShieldCheck,
  ClipboardList,
  UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const iconByName = {
  Solicitudes: ClipboardList,
  "Gestion de Citas": CalendarDays,
  Llamados: Megaphone,
  Dashboard: BarChart3,
  Configuracion: Settings,
  "Usuarios y Roles": UserCog
};

const protectedPrefixes = ["/solicitudes", "/citas", "/llamados", "/dashboard", "/configuracion"];

export function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, canAccess } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    const protectedPath = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
    if (protectedPath && !canAccess(pathname)) {
      router.replace(user.menu?.[0]?.ruta || "/login");
    }
  }, [loading, user, pathname, router, canAccess]);

  if (loading || !user || !canAccess(pathname)) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">Cargando acceso...</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r bg-card md:flex md:flex-col">
        <div className="border-b p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold">Gestion Demanda</p>
              <p className="text-xs text-muted-foreground">Valparaiso</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {user.menu.map((item) => {
            const Icon = iconByName[item.nombre] || ClipboardList;
            const active = pathname === item.ruta || pathname.startsWith(`${item.ruta}/`);
            return (
              <Link
                key={`${item.id}-${item.ruta}`}
                href={item.ruta}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon size={18} />
                <span>{item.nombre}</span>
              </Link>
            );
          })}
          {user.menu.some((item) => item.nombre === "Solicitudes") && (
            <Link
              href="/solicitudes/revisar"
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                pathname.startsWith("/solicitudes/revisar")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <ClipboardList size={18} />
              <span>Revisar solicitudes</span>
            </Link>
          )}
        </nav>

        <div className="border-t p-4">
          <div className="mb-3">
            <p className="truncate text-sm font-medium">{user.nombre}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="muted">{user.rol.nombre}</Badge>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start" onClick={logout}>
            <LogOut size={16} />
            Salir
          </Button>
        </div>
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-10 border-b bg-card/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Gestion Demanda</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Salir
            </Button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {user.menu.map((item) => (
              <Link key={item.id} href={item.ruta} className="whitespace-nowrap rounded-md border px-3 py-2 text-sm">
                {item.nombre}
              </Link>
            ))}
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
