# Backend

Ten katalog jest samodzielnym pakietem wdrożeniowym. Nie potrzebuje plików
z `frontend/`. Zawiera API Express / TypeScript, Prisma i konfigurację PostgreSQL.

## Uruchomienie na serwerze backendu

```bash
cp .env.example .env
```

Ustaw w `.env` własny `ADMIN_TOKEN`, adres frontendu w `CORS_ORIGIN`
(np. `http://192.168.1.10:5173`) i opcjonalnie `BACKEND_PORT` oraz `APP_TIMEZONE`.

```bash
docker compose up -d --build --wait
```

API jest dostępne na porcie `3001` (lub `BACKEND_PORT`), pod `/api`.
Przykładowe sprawdzenie: `http://ADRES_BACKENDU:3001/api/health`.
Frontend łączy się z tym serwerem przez własne ustawienie `BACKEND_URL`.

PostgreSQL jest dostępny tylko dla backendu w prywatnej sieci Dockera.
Dane są przechowywane w wolumenie `tablet_app_backend_postgres-data`.
Konta bazy i ich dotychczasowe hasła pozostają takie jak przed podziałem projektu.

Migracje Prisma wykonują się automatycznie podczas startu backendu. Opcjonalny
seed dla nowej bazy:

```bash
docker compose exec -T backend npm run db:seed
```

Seed usuwa istniejące dane i tworzy zestaw demonstracyjny. Instrukcja przeniesienia
istniejącej bazy znajduje się w głównym README projektu.

Logi i zatrzymanie:

```bash
docker compose logs -f backend
docker compose down
```

## Praca nad kodem bez Dockera

Wymagany Node.js 22 i istniejąca baza PostgreSQL z wykonanymi migracjami.
Ustaw zmienne `DATABASE_URL` (konto odczytu), `DATABASE_ADMIN_URL` (konto zapisu),
`ADMIN_TOKEN`, `APP_TIMEZONE` i `CORS_ORIGIN` w środowisku procesu. Domyślny port
to `3001`, można go zmienić zmienną `PORT`.

```bash
npm ci
npm run db:migrate
npm run dev
```

Kompilacja: `npm run build`. Start skompilowanego API: `npm start`.
Szczegóły bazy: [database/README.md](database/README.md).
