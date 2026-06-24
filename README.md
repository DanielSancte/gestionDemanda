# Gestion de la Demanda

Monorepo para la primera etapa del proyecto Gestion de la Demanda.

## Stack

- MySQL 8.4 con Docker Compose
- NextJS App Router, React y JavaScript
- Tailwind CSS con componentes estilo shadcn/ui
- Microservicios Node/Express para autenticacion y solicitudes
- Prisma como capa de acceso a MySQL

## Puesta en marcha

1. Copia `.env.example` a `.env`.
2. Levanta MySQL:

```bash
docker compose up -d mysql
```

3. Instala dependencias:

```bash
npm install
```

4. Crea el schema y carga datos iniciales:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Inicia la app y servicios:

```bash
npm run dev
```

La web queda en `http://localhost:3000`, auth en `http://localhost:4001` y solicitudes en `http://localhost:4002`.

## Usuarios de prueba

Todos usan password `demo123`.

- `admin@demo.local` / Administrador
- `orientador@demo.local` / Orientador
- `comunicador@demo.local` / Comunicador
- `some@demo.local` / SOME
- `orientador.comunicador@demo.local` / Orientador y Comunicador
- `gestor.comunicador@demo.local` / Gestor y Comunicador
- `full@demo.local` / Full

## Reglas de pendientes

- Solicitudes pendientes: `solicitudes.estado_solicitud = 'En Curso'`.
- Citas o gestiones pendientes: `llamadas.respuesta_usuario` en `Sin llamadas`, `No contesta (1)`, `No contesta (2)`.
