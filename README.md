# Room Tablet Preview

Projekt jest podzielony na dwie niezależnie wdrażane aplikacje:

- `frontend/` — widok sal i panel administratora, budowane do plików statycznych
  i udostępniane przez jeden serwer Nginx;
- `backend/` — API Node.js / Express, Prisma i PostgreSQL.

Każdy katalog ma własny `Dockerfile`, `docker-compose.yml`, `.env.example`
i instrukcję uruchomienia. Na serwer wystarczy skopiować tylko właściwy katalog,
bez `node_modules`, `dist` i lokalnych plików `.env`.

## Dwa osobne serwery

Przykład: serwer frontendu `192.168.1.10`, serwer backendu `192.168.1.20`.
Oba wymagają Dockera z Buildx/BuildKit oraz Docker Compose.

### Serwer backendu

Skopiuj na niego katalog `backend`, a następnie w tym katalogu:

```bash
cp .env.example .env
```

Ustaw w `.env` własny `ADMIN_TOKEN` i adres strony:

```dotenv
BACKEND_PORT=3001
ADMIN_TOKEN=wstaw-wlasny-dlugi-token
APP_TIMEZONE=Europe/Warsaw
CORS_ORIGIN=http://192.168.1.10:5173
```

Uruchom API i bazę:

```bash
docker compose up -d --build --wait
```

Migracje wykonują się automatycznie. Na nowej bazie można opcjonalnie utworzyć
dane demonstracyjne:

```bash
docker compose exec -T backend npm run db:seed
```

Seed usuwa istniejące dane i odtwarza zestaw demonstracyjny.

### Serwer frontendu

Skopiuj na niego katalog `frontend`, a następnie w tym katalogu:

```bash
cp .env.example .env
```

Ustaw adres serwera backendu osiągalny **z serwera frontendu**:

```dotenv
BACKEND_URL=http://192.168.1.20:3001
FRONTEND_PORT=5173
TABLET_ROOM_ID=205
```

`BACKEND_URL` musi zawierać `http://` lub `https://`, bez końcowego `/`
i bez `/api`. Nie wpisuj `localhost`, jeśli backend działa na innej maszynie.

```bash
docker compose up -d --build --wait
```

Adresy w przeglądarce:

- widok domyślnej sali: `http://192.168.1.10:5173/`;
- konkretna sala: `http://192.168.1.10:5173/room/205`;
- panel administratora: `http://192.168.1.10:5173/admin/`.

Panel działa na tym samym porcie co widok sal; dawny port `5174` nie jest
potrzebny przy wdrożeniu. Logowanie używa `ADMIN_TOKEN` ustawionego w backendzie.

## Komunikacja między aplikacjami

Przeglądarka łączy się z frontendem. Nginx przekazuje żądania `/api` do
`BACKEND_URL`, zachowując ścieżkę, parametry i nagłówek autoryzacji.
Adres backendu nie jest wbudowany w kod JavaScript.

Serwer frontendu musi mieć dostęp do portu API backendu (domyślnie `3001`).
PostgreSQL nie publikuje portu na hosta i działa w prywatnej sieci backendu.
Frontend może uruchomić się także wtedy, gdy API jest chwilowo niedostępne.

Po zmianie adresu backendu wystarczy odtworzyć kontener frontendu:

```bash
docker compose up -d --force-recreate frontend
```

`TABLET_ROOM_ID` jest ustawiany podczas budowania obrazu. Po jego zmianie użyj:

```bash
docker compose up -d --build frontend
```

Numer w `/room/:roomId` ma pierwszeństwo przed domyślną salą. Dla jednego serwera
obsługującego wiele tabletów pozostaw `TABLET_ROOM_ID` puste i przypisz każdemu
tabletowi stały adres, np. `/room/30` lub `/room/205`. Sam `/` bez domyślnej sali
wyświetla informację o braku konfiguracji.

## Uruchomienie lokalne całego projektu

Główny plik Compose pozostaje dostępny do pracy na jednym komputerze:

```bash
docker compose up -d --build --wait --remove-orphans
```

- widok sal: `http://localhost:5173`;
- panel: `http://localhost:5173/admin/`;
- API: `http://localhost:3001/api/health`.

Opcja `--remove-orphans` usuwa kontener dawnego osobnego panelu admina.
Istniejący wolumen `tablet_app_web_postgres-data` jest zachowany, gdy uruchamiasz
projekt pod dotychczasową nazwą `tablet_app_web`, ustawioną teraz jawnie w Compose.
Nadal można użyć własnej nazwy projektu przez `docker compose -p NAZWA`.
Zmienne `POSTGRES_VOLUME` i `POSTGRES_VOLUME_EXTERNAL=true` pozwalają wskazać
istniejący wolumen niezależnie od nazwy projektu. Zatrzymanie aplikacji:

```bash
docker compose down
```

## Przeniesienie dotychczasowej bazy na drugi serwer

Osobny backend używa własnego wolumenu `tablet_app_backend_postgres-data`.
Na tym samym serwerze można użyć dotychczasowego wolumenu bez kopiowania danych:
zatrzymaj poprzednie API i PostgreSQL, a w `.env` backendu ustaw
`POSTGRES_VOLUME=tablet_app_web_postgres-data` oraz `POSTGRES_VOLUME_EXTERNAL=true`.
Potem uruchom Compose z samego katalogu `backend/`.

Przed przeniesieniem wykonaj kopię istniejącej bazy z głównego katalogu projektu:

```bash
docker compose exec -T database pg_dump -U admin -d tablet_schedule -Fc > tablet_schedule.dump
```

Przenieś plik na serwer backendu. Po pierwszym uruchomieniu bazy zatrzymaj API,
odtwórz kopię i uruchom API ponownie, aby wykonało ewentualne nowe migracje:

```bash
docker compose stop backend
docker compose exec -T database pg_restore -U admin -d tablet_schedule --clean --if-exists --exit-on-error < tablet_schedule.dump
docker compose up -d backend
```

Nie uruchamiaj seeda po odtworzeniu kopii.

## API i model danych

Publiczne endpointy: `GET /api/health`, `GET /api/rooms`,
`GET /api/room/:roomId` oraz `GET /api/schedule` (filtry `roomId` i `date`).
Endpoint sali obsługuje również `?date=YYYY-MM-DD`; bez tego parametru zwraca
dzisiejszy plan. Kontrakt JSON i przykłady opisano w [README backendu](backend/README.md#dane-sali-w-json).
Panel korzysta z `/api/admin/*`: logowania, sesji, sal, harmonogramu,
słowników, konfliktów i dashboardu. Autoryzacja: `Authorization: Bearer <ADMIN_TOKEN>`.

Schemat jest w `backend/prisma/schema.prisma`, a migracje w
`backend/prisma/migrations/`. Publiczne API używa konta bazy `web_app` do odczytu;
migracje i operacje panelu administracyjnego używają konta `admin`.

Szczegóły: [frontend](frontend/README.md), [backend](backend/README.md),
[baza danych](backend/database/README.md).
