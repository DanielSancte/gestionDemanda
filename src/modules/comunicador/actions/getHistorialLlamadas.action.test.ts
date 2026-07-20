import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/shared/lib/prisma", () => ({
    prisma: {
        llamada: { findMany: vi.fn() },
        funcionario: { findMany: vi.fn() }
    }
}));
vi.mock("@/shared/lib/auth", () => ({ requireSessionUser: vi.fn() }));
vi.mock("@/shared/lib/logger", () => ({ AuditLogger: { logDataAccess: vi.fn() } }));

import { getHistorialLlamadas } from "./getHistorialLlamadas.action";
import { prisma } from "@/shared/lib/prisma";
import { requireSessionUser } from "@/shared/lib/auth";

beforeEach(() => {
    vi.clearAllMocks();
    (requireSessionUser as any).mockResolvedValue({ rut: "1-9", email: "c@x.cl", nombre: "Com", centro_id: "501", rol: { id: 3, nombre: "Comunicador" }, menu: [] });
});

describe("getHistorialLlamadas", () => {
    it("rechaza rol sin acceso al comunicador", async () => {
        (requireSessionUser as any).mockResolvedValue({ rut: "1-9", email: "o@x.cl", nombre: "O", centro_id: "501", rol: { id: 2, nombre: "Orientador" }, menu: [] });
        await expect(getHistorialLlamadas("CITA-1")).rejects.toThrow("No tienes permiso");
    });

    it("mapea las llamadas y resuelve el nombre del comunicador", async () => {
        (prisma.llamada.findMany as any).mockResolvedValue([
            { id_llamada: 2, fecha_llamada: new Date("2026-07-19T10:00:00"), respuesta_usuario: "No contesta", observacion: "no atiende", rut_comunicador: "5-5" }
        ]);
        (prisma.funcionario.findMany as any).mockResolvedValue([{ rut: "5-5", nombre: "Ana" }]);
        const r = await getHistorialLlamadas("CITA-1");
        expect(r).toEqual([
            { id_llamada: 2, fecha_llamada: new Date("2026-07-19T10:00:00"), respuesta_usuario: "No contesta", observacion: "no atiende", comunicador: "Ana" }
        ]);
    });

    it("devuelve lista vacía cuando no hay llamadas", async () => {
        (prisma.llamada.findMany as any).mockResolvedValue([]);
        (prisma.funcionario.findMany as any).mockResolvedValue([]);
        const r = await getHistorialLlamadas("CITA-1");
        expect(r).toEqual([]);
    });
});
