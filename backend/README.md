# Backend — instalacja i utrzymanie

Samodzielny pakiet obejmuje API Express/TypeScript, Prisma i PostgreSQL. Obsługuje publiczny odczyt planów oraz operacje administratora. Lokalny cache JSON należy do frontendu.

Dokumentacja: [API](docs/API.md), [pliki i funkcje](docs/KOD.md), [baza danych](database/README.md), [testy](../docs/WERYFIKACJA.md), [cały projekt](../README.md). Linki nadrzędne wymagają pełnego repozytorium; samodzielne wdrożenie ich nie potrzebuje.

## Wdrożenie przez Docker

Wymagany Docker z BuildKit i Compose v2 obsługujący `--wait`. W katalogu `backend/` utwórz `.env` z `.env.example` (Bash: `cp .env.example .env`, PowerShell: `Copy-Item .env.example .env`). Nie nadpisuj istniejących ustawień. Wpisz np.:

```dotenv
BACKEND_PORT=3001
ADMIN_TOKEN=wstaw-wlasny-dlugi-token
APP_TIMEZONE=Europe/Warsaw
CORS_ORIGIN=http://192.168.1.10:5173
```

```bash
docker compose config --quiet
docker compose up -d --build --wait
docker compose ps
curl --fail http://localhost:3001/api/health
```

PowerShell: użyj `curl.exe`. Poprawna odpowiedź: `{"status":"ok","service":"room-tablet-backend","database":"ok","timestamp":"..."}`. Health sprawdza `SELECT 1`, nie kompletność danych aplikacji.

Obraz `node:22-alpine` instaluje OpenSSL, zależności przez `npm ci`, generuje klienta Prisma i kompiluje `src/` do `dist/`. Przy każdym starcie wykonuje `npm run db:migrate`, potem `npm start`. Nieudana migracja zatrzymuje start API; `restart: unless-stopped` może ponawiać start.

API czeka na zdrową bazę i przed nasłuchem sprawdza `SELECT 1`. Healthcheck API: co 10 s, timeout 3 s, 5 prób, okres startowy 20 s. PostgreSQL: co 10 s, timeout 5 s, 5 prób, okres startowy 10 s. Status `unhealthy` sam nie restartuje kontenera.

Nowa baza jest pusta. Opcjonalnie `docker compose exec -T backend npm run db:seed` tworzy demo, **usuwając dotychczasowe dane aplikacji**. Przygotowanie pustej instalacji bez seeda: [baza](database/README.md).

## Konfiguracja

`src/config/env.ts` odczytuje środowisko procesu. Compose używa `.env` do podstawień; `node dist/index.js` i `tsx watch src/index.ts` same nie ładują tego pliku. Prisma CLI ma osobne `import 'dotenv/config'` w `prisma.config.ts`.

| Zmienna | Domyślnie w kodzie Node | Znaczenie |
| --- | --- | --- |
| `PORT` | 3001 | Port API, w Compose 3001 |
| `DATABASE_URL` | `postgresql://web_app:web_app_password@localhost:5432/tablet_schedule` | Publiczny odczyt |
| `DATABASE_ADMIN_URL` | `postgresql://admin:admin_password@localhost:5432/tablet_schedule` | Osobne połączenie administratora, seeda i migracji |
| `ADMIN_TOKEN` | `change-me-admin-token` | Wspólny sekret administratora |
| `APP_TIMEZONE` | `Europe/Warsaw` | Data „dzisiaj” i statusy zajęć |
| `CORS_ORIGIN` | `*` | `*` albo lista originów rozdzielona przecinkami |
| `BACKEND_PORT` | 3001 w Compose | Port hosta, nie port procesu |
| `POSTGRES_VOLUME` | Nazwa projektu + `_postgres-data` | Nazwany wolumen bazy |
| `POSTGRES_VOLUME_EXTERNAL` | `false` w Compose | `true` wymaga istniejącego wolumenu i wyłącza zarządzanie jego cyklem życia |

Compose ma adresy i hasła bazy wpisane w YAML. Dopisanie `DATABASE_URL` do `.env` nie nadpisuje tych wartości. Zmiana danych wymaga spójnej konfiguracji usług i faktycznych ról PostgreSQL. `POSTGRES_PASSWORD` na istniejącym wolumenie samo nie zmienia hasła roli. Domyślne konta są ustawieniami demonstracyjnymi.

`CORS_ORIGIN` to origin bez ścieżki, np. `http://192.168.1.10:5173`. Własny zewnętrzny endpoint wywoływany z przeglądarki wymaga jego dopuszczenia. CORS nie jest autoryzacją. `Number(PORT) || 3001` nie zapewnia pełnej walidacji portu. Nieprawidłowa strefa IANA powoduje błędy przy obliczaniu czasu; ustaw zgodną strefę w API i cache.

## Rozwój bez Dockera

Użyj aktualnego Node.js 22, **co najmniej 22.12.0 w linii 22**, zgodnie z [wymaganiami Prisma 7](https://www.prisma.io/docs/orm/v7/reference/system-requirements). Potrzebny PostgreSQL z przygotowanymi rolami i osiągalnym portem. Dostarczone Compose nie publikuje 5432; do procesu na hoście użyj osobnej bazy albo własnego override. Nazwa `database` działa w sieci Dockera.

```bash
export DATABASE_URL=postgresql://web_app:web_app_password@localhost:5432/tablet_schedule
export DATABASE_ADMIN_URL=postgresql://admin:admin_password@localhost:5432/tablet_schedule
export ADMIN_TOKEN=wstaw-wlasny-token
export APP_TIMEZONE=Europe/Warsaw
export CORS_ORIGIN=http://localhost:5173
npm ci
npm run db:migrate
npm run dev
```

To składnia Bash. PowerShell ustawia zmienne przez `$env:DATABASE_URL='...'`. Skrypty `db:migrate` i `prisma:migrate:deploy` zawierają podstawienie POSIX. W natywnym PowerShell/cmd ustaw adres administratora jako `DATABASE_URL`, wykonaj `npx prisma migrate deploy`, a przed startem przywróć adres odczytu. Można też użyć WSL/Git Bash.

`DATABASE_URL` musi być dostępne już podczas `npm ci`, bo skrypt postinstall ładuje konfigurację Prisma przez `env('DATABASE_URL')`. Generowanie klienta samo nie wymaga działającego połączenia z bazą.

Alternatywnie po kompilacji: `node --env-file=.env.runtime dist/index.js`, gdzie własny `.env.runtime` ma klucze z powyższej tabeli i nie jest dodawany do Git.

## Polecenia npm

| Skrypt | Działanie |
| --- | --- |
| `dev` | `tsx watch src/index.ts`, restart po zmianie kodu |
| `build` | `tsc -p tsconfig.json`, typy i emitowanie `dist/` |
| `start` | `node dist/index.js`, wymaga buildu, nie uruchamia migracji |
| `db:migrate`, `prisma:migrate:deploy` | Istniejące migracje z `DATABASE_ADMIN_URL`, awaryjnie `DATABASE_URL` |
| `prisma:migrate:dev` | Tworzenie migracji developerskiej, odpowiednie prawa i shadow database |
| `db:seed`, `prisma:seed` | `tsx prisma/seed.ts`, zastąpienie danych demonstracyjnymi |
| `prisma:generate` | Generowanie klienta ze schematu |
| `postinstall` | Automatyczne `prisma generate` |
| `test:integration` | Build i sześć testów HTTP z osobną bazą `_test` |

`prisma:migrate:dev` nie podmienia adresu na `DATABASE_ADMIN_URL`; ustaw `DATABASE_URL` konta z prawami do migracji. Nowa zmiana modelu wymaga nowej migracji, generacji klienta i przebudowy. Nie zmieniaj SQL migracji już zastosowanych w bazie.

## Dane sali w JSON

`GET /api/room/205` zwraca dzisiejszy plan według `APP_TIMEZONE`; `GET /api/room/205?date=2026-11-01` plan wybranego dnia. `205` to `roomCode`, nie klucz liczbowy bazy. Pełny kontrakt: [API](docs/API.md#publiczny-model-planu-sali).

Status liczony jest dla `[startTime, endTime)`: przeszły dzień — `finished`, przyszły — `upcoming`. Pusta istniejąca sala daje 200, nieznana 404. Backend nie dodaje metadanych `cache`.

## Obsługa i diagnoza

```bash
docker compose logs --tail=100 backend database
docker compose stop backend
docker compose up -d backend
docker compose down
```

`restart` zachowuje stare środowisko. Po zmianie `.env` użyj `docker compose up -d --force-recreate backend`, po zmianie kodu dodaj `--build`. `down` zachowuje bazę, `down -v` może ją usunąć. Nie uruchamiaj dwóch PostgreSQL na tym samym wolumenie. Przenoszenie danych: [baza](database/README.md).

| Objaw | Co sprawdzić |
| --- | --- |
| API nie startuje | Log migracji, PostgreSQL, oba adresy połączeń, uprawnienia ról |
| Health działa, sala 404 | `GET /api/rooms`; migracje nie dodają sal |
| Demo działało wczoraj, dziś pusto | Seed tworzy konkretną datę, nie plan cykliczny |
| Panel 401 | `ADMIN_TOKEN` backendu i wpisany token; token kopii jest niezależny |
| CORS w przeglądarce | Dokładny origin, schemat i port |
| Odczyt działa, zapis nie | `DATABASE_ADMIN_URL`, aktywność słowników i relacje |
| Puste pola wyboru | Brak danych początkowych, aktywnego budynku lub piętra |
| Usuwanie 409 | Powiązane rekordy; sprawdź zależności, dla sali jawne `cascade=true` |

Jest jeden współdzielony token, bez kont użytkowników, JWT i wygasających sesji. Repo nie konfiguruje TLS, limitowania żądań ani audytu zmian. Te elementy należą do konfiguracji wdrożenia. Nieobsłużone błędy, również parsera JSON, trafiają do ogólnej odpowiedzi 500; nie zakładaj osobnego 400 dla każdego błędu wejścia.
