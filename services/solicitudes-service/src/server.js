import "dotenv/config";
import crypto from "node:crypto";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@gestion/db";

const app = express();
const port = process.env.SOLICITUDES_SERVICE_PORT || 4002;
const jwtSecret = process.env.JWT_SECRET || "desarrollo_local";
const ESTADOS_CITAS_PENDIENTES = ["Sin llamadas", "No contesta (1)", "No contesta (2)"];

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  try {
    req.auth = jwt.verify(token, jwtSecret);
    next();
  } catch {
    return res.status(401).json({ message: "Token invalido o expirado" });
  }
}

function canAccessSolicitudes(roleName) {
  return ["Administrador", "Orientador", "SOME", "Orientador y Comunicador", "Full"].includes(roleName);
}

function requireSolicitudesAccess(req, res, next) {
  if (!canAccessSolicitudes(req.auth.roleName)) {
    return res.status(403).json({ message: "No tienes permiso para solicitudes" });
  }
  next();
}

function normalizeRut(value) {
  return String(value || "").trim();
}

function buildSolicitudWhere(query) {
  const where = {};
  if (query.rut) where.rut_usuario = normalizeRut(query.rut);
  if (query.estado) where.estado_solicitud = query.estado;
  if (query.centroId) where.centro_id = query.centroId;
  if (query.fechaDesde || query.fechaHasta) {
    where.fecha_inicio = {};
    if (query.fechaDesde) where.fecha_inicio.gte = new Date(`${query.fechaDesde}T00:00:00`);
    if (query.fechaHasta) where.fecha_inicio.lte = new Date(`${query.fechaHasta}T23:59:59`);
  }
  return where;
}

async function ensureUsuario(data) {
  const rut = normalizeRut(data.rut_usuario);
  const existing = await prisma.usuario.findUnique({ where: { rut } });
  if (existing) return existing;

  return prisma.usuario.create({
    data: {
      rut,
      nombre: data.nombre_usuario,
      apellido: data.apellido_usuario,
      telefono: data.telefono || null,
      correo_contacto: data.correo_contacto || null,
      centro_id: data.centro_id || null
    }
  });
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "solicitudes-service" });
});

app.get("/solicitudes/pendientes", requireAuth, requireSolicitudesAccess, async (req, res) => {
  const rutUsuario = normalizeRut(req.query.rutUsuario);
  if (!rutUsuario) {
    return res.status(400).json({ message: "rutUsuario es requerido" });
  }

  const [solicitudesPendientes, citasPendientes] = await Promise.all([
    prisma.solicitud.findMany({
      where: {
        rut_usuario: rutUsuario,
        estado_solicitud: "En Curso"
      },
      include: {
        tipoSolicitud: true,
        motivo: true
      },
      orderBy: { fecha_inicio: "desc" }
    }),
    prisma.llamada.findMany({
      where: {
        rut_usuario: rutUsuario,
        respuesta_usuario: { in: ESTADOS_CITAS_PENDIENTES }
      },
      include: {
        solicitud: {
          include: {
            tipoSolicitud: true,
            motivo: true
          }
        },
        comunicador: true
      },
      orderBy: [{ fecha_llamada: "desc" }, { id_llamada: "desc" }]
    })
  ]);

  res.json({ solicitudesPendientes, citasPendientes });
});

app.get("/solicitudes", requireAuth, requireSolicitudesAccess, async (req, res) => {
  const solicitudes = await prisma.solicitud.findMany({
    where: buildSolicitudWhere(req.query),
    include: {
      usuario: true,
      tipoSolicitud: true,
      motivo: true,
      orientador: true,
      gestor: true
    },
    orderBy: { fecha_inicio: "desc" },
    take: 100
  });

  res.json({ solicitudes });
});

app.post("/solicitudes", requireAuth, requireSolicitudesAccess, async (req, res) => {
  const data = req.body || {};
  const required = ["rut_usuario", "nombre_usuario", "apellido_usuario", "tipo_solicitud_id", "motivo_id"];
  const missing = required.filter((field) => !data[field]);

  if (missing.length > 0) {
    return res.status(400).json({ message: `Faltan campos requeridos: ${missing.join(", ")}` });
  }

  const usuario = await ensureUsuario(data);
  const solicitud = await prisma.solicitud.create({
    data: {
      id_solicitud: `SOL-${crypto.randomUUID()}`,
      rut_orientador: req.auth.rut,
      rut_usuario: usuario.rut,
      tipo_solicitud_id: Number(data.tipo_solicitud_id),
      motivo_id: Number(data.motivo_id),
      ultimo_control: data.ultimo_control || null,
      descripcion: data.descripcion || null,
      disponibilidad_llamada: data.disponibilidad_llamada || null,
      priorizacion_admin: data.priorizacion_admin ? Number(data.priorizacion_admin) : null,
      rut_gestor: data.rut_gestor || null,
      accion: data.accion || null,
      razon_rechazo: data.razon_rechazo || null,
      estado_solicitud: data.estado_solicitud || "En Curso",
      centro_id: data.centro_id || null,
      observacion_rechazo: data.observacion_rechazo || null
    },
    include: {
      usuario: true,
      tipoSolicitud: true,
      motivo: true
    }
  });

  res.status(201).json({ solicitud });
});

app.get("/catalogos", requireAuth, async (_req, res) => {
  const [tiposSolicitud, motivos] = await Promise.all([
    prisma.tipoSolicitud.findMany({
      where: { estado: "Activo" },
      orderBy: { nombre_tipo_solicitud: "asc" }
    }),
    prisma.motivo.findMany({
      where: { estado: "Activo" },
      orderBy: { nombre_motivo: "asc" }
    })
  ]);

  res.json({ tiposSolicitud, motivos });
});

app.listen(port, () => {
  console.log(`solicitudes-service listening on http://localhost:${port}`);
});
