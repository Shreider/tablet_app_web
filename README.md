# Room Tablet Preview

Prototyp webowej aplikacji salowej w architekturze:
- `frontend` (React + Vite + Tailwind),
- `backend` (Node.js + Express),
- `database` (PostgreSQL).

## Docelowy przeplyw danych

Aplikacja dziala w modelu **DB-first**:
- frontend pobiera dane tylko z backendu (`/api/*`),
- backend pobiera dane tylko z PostgreSQL,
- runtime nie korzysta z lokalnych danych testowych jako zrodla danych.

Dane startowe istnieja wyłącznie w seedzie i sluza tylko do wypelnienia bazy.

## Endpointy API

Wszystkie endpointy backendu sa dostepne wyłącznie pod prefiksem `/api`.

- `GET /api/health`
- `GET /api/rooms`
- `GET /api/room/:roomId`
- `GET /api/schedule`
- `GET /api/schedule?roomId=<id>`
- `GET /api/schedule?date=YYYY-MM-DD`

Przyklady:
- `http://localhost:3001/api/rooms`
- `http://localhost:3001/api/room/30`
- `http://localhost:3001/api/schedule?roomId=A12`

Legacy trasy poza `/api` (np. `/health`, `/room/...`, `/rooms`) sa wylaczone.

## Frontend routing

Frontend zachowuje routing widokow:
- `/room/:roomId`

Przyklady:
- `http://localhost:5173/room/30`
- `http://192.168.255.2:5173/room/A12`

Strona glowna `/` pobiera liste sal z `/api/rooms` i przekierowuje do pierwszej sali z bazy.

## Baza danych

Główne tabele:
- `rooms`
- `schedule_entries`

Konta bazy danych:
- `admin` - konto administracyjne (tworzenie schematu, migracje, seed),
- `web_app` - konto runtime dla backendu API (odczyt danych).

Schema jest utrzymywana przez:
- `database/init/001_schema.sql` (inicjalizacja kontenera DB),
- `npm run db:migrate` (idempotentne dopiecie schematu po stronie backendu).

## Seed

Seed danych testowych:
- sale: `30`, `31`, `101`, `205`, `A12`,
- rozne harmonogramy, prowadzacy, grupy, godziny i statusy dnia.

Uruchomienie seedu:

```bash
docker compose exec -T backend npm run db:seed
```

Seed jest powtarzalny (czysci i wypelnia dane od nowa).

## Uruchomienie

Wymagania:
- Docker
- Docker Compose

Start projektu:

```bash
docker compose up -d --build
```

Przy pierwszym uruchomieniu po zmianie kont DB wykonaj reset wolumenu:

```bash
docker compose down -v
docker compose up -d --build
```

Domyslne hasla:
- `admin` / `admin_password`
- `web_app` / `web_app_password`

Migracje schematu:

```bash
docker compose exec -T backend npm run db:migrate
```

Seed danych:

```bash
docker compose exec -T backend npm run db:seed
```

Zatrzymanie:

```bash
docker compose down
```

Zatrzymanie z resetem wolumenu bazy:

```bash
docker compose down -v
```

## Konfiguracja sieci i CORS

- backend nasluchuje na `0.0.0.0:3001`,
- frontend na `0.0.0.0:5173`,
- CORS dopuszcza `http://localhost:5173` i `http://192.168.255.2:5173`,
- frontend komunikuje sie z backendem przez `/api` (proxy Vite).
