# Room Tablet Preview

Aplikacja webowa w architekturze:
- `frontend` (React + Vite + Tailwind, aplikacja użytkowa),
- `admin` (React + Vite + Tailwind, osobny panel administracyjny),
- `backend` (Node.js + Express + TypeScript),
- `database` (PostgreSQL),
- `Prisma` (schema, migracje, Prisma Client).

## Model danych i Prisma

Model bazy jest utrzymywany przez Prisma:
- schema: `backend/prisma/schema.prisma`,
- migracje: `backend/prisma/migrations/*`,
- klient: `@prisma/client`.

Główne encje:
- `Room` (`rooms`),
- `ScheduleEntry` (`schedule_entries`) z relacją `Room 1:N ScheduleEntry`.

## Endpointy API

Wszystkie endpointy backendu są pod `/api`.

Publiczne:
- `GET /api/health`
- `GET /api/rooms`
- `GET /api/room/:roomId`
- `GET /api/schedule`
- `GET /api/schedule?roomId=<id>`
- `GET /api/schedule?date=YYYY-MM-DD`

Admin (`/api/admin/*`):
- `POST /api/admin/auth/login`
- `GET /api/admin/auth/session`
- `GET /api/admin/dashboard`
- `GET /api/admin/rooms`
- `GET /api/admin/rooms/options`
- `GET /api/admin/rooms/:id`
- `POST /api/admin/rooms`
- `PUT /api/admin/rooms/:id`
- `DELETE /api/admin/rooms/:id`
- `GET /api/admin/schedule-entries`
- `GET /api/admin/schedule-entries/options`
- `GET /api/admin/schedule-entries/:id`
- `POST /api/admin/schedule-entries`
- `PUT /api/admin/schedule-entries/:id`
- `DELETE /api/admin/schedule-entries/:id`

## Routing i porty

- Frontend użytkowy: `http://localhost:5173`
- Panel admina: `http://localhost:5174`
- Backend API: `http://localhost:3001`
- Database: brak publikacji portu na hosta (dostęp tylko z backendu w sieci Dockera)
- Widok sali (frontend): `/room/:roomId`
- Admin app (osobna aplikacja): `/login`, `/dashboard`, `/rooms`, `/schedule-entries`

## Separacja sieciowa

`docker-compose` używa dwóch sieci:
- `public_net`: `frontend`, `admin`, `backend`
- `data_net` (`internal: true`): `backend`, `database`

Dzięki temu tylko `backend` ma dostęp do `database`.

## Autoryzacja admina

Panel admina (aplikacja na porcie 5174) i endpointy `/api/admin` są zabezpieczone tokenem:
- nagłówek: `Authorization: Bearer <ADMIN_TOKEN>`
- token konfigurowany przez `ADMIN_TOKEN` w backendzie.

## Uruchomienie

Wymagania:
- Docker
- Docker Compose

Start:

```bash
docker compose up -d --build
```

Przy pierwszym uruchomieniu:
- backend uruchamia migracje Prisma (`npm run db:migrate`),
- opcjonalny seed:

```bash
docker compose exec -T backend npm run db:seed
```

Stop:

```bash
docker compose down
```

Reset wolumenu DB:

```bash
docker compose down -v
```

## Konfiguracja środowiska

Domyślne zmienne w `docker-compose.yml`:
- `DATABASE_URL` (runtime read-only: `web_app`),
- `DATABASE_ADMIN_URL` (operacje administracyjne / migracje),
- `ADMIN_TOKEN`,
- `APP_TIMEZONE`,
- `CORS_ORIGIN`,
- `VITE_PUBLIC_APP_BASE_URL` (w usłudze `admin`, link do aplikacji użytkowej).
