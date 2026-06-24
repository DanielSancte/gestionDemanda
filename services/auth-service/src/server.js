import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@gestion/db";

const app = express();
const port = process.env.AUTH_SERVICE_PORT || 4001;
const jwtSecret = process.env.JWT_SECRET || "desarrollo_local";

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

function signUser(funcionario) {
  return jwt.sign(
    {
      rut: funcionario.rut,
      email: funcionario.email,
      roleId: funcionario.role.id_rol,
      roleName: funcionario.role.nombre_rol
    },
    jwtSecret,
    { expiresIn: "8h" }
  );
}

function toSession(funcionario) {
  const menu = funcionario.role.menus.map((item) => ({
    id: item.id_menu,
    nombre: item.nombre,
    descripcion: item.descripcion,
    ruta: item.ruta,
    imagen: item.imagen
  }));

  return {
    rut: funcionario.rut,
    email: funcionario.email,
    nombre: funcionario.nombre,
    estado: funcionario.estado,
    centro_id: funcionario.centro_id,
    rol: {
      id: funcionario.role.id_rol,
      nombre: funcionario.role.nombre_rol
    },
    menu
  };
}

async function findFuncionarioByLogin(login) {
  return prisma.funcionario.findFirst({
    where: {
      OR: [{ email: login }, { rut: login }]
    },
    include: {
      role: {
        include: {
          menus: {
            orderBy: { id_menu: "asc" }
          }
        }
      }
    }
  });
}

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

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "auth-service" });
});

app.post("/auth/login", async (req, res) => {
  const { login, password } = req.body || {};

  if (!login || !password) {
    return res.status(400).json({ message: "Login y password son requeridos" });
  }

  const funcionario = await findFuncionarioByLogin(login);
  if (!funcionario || funcionario.estado !== "Activo") {
    return res.status(401).json({ message: "Credenciales invalidas" });
  }

  const validPassword = await bcrypt.compare(password, funcionario.password_hash);
  if (!validPassword) {
    return res.status(401).json({ message: "Credenciales invalidas" });
  }

  res.json({
    token: signUser(funcionario),
    user: toSession(funcionario)
  });
});

app.get("/auth/me", requireAuth, async (req, res) => {
  const funcionario = await prisma.funcionario.findUnique({
    where: { rut: req.auth.rut },
    include: {
      role: {
        include: {
          menus: {
            orderBy: { id_menu: "asc" }
          }
        }
      }
    }
  });

  if (!funcionario || funcionario.estado !== "Activo") {
    return res.status(401).json({ message: "Sesion no disponible" });
  }

  res.json({ user: toSession(funcionario) });
});

app.listen(port, () => {
  console.log(`auth-service listening on http://localhost:${port}`);
});
