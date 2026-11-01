# Frontend — instalacja i konfiguracja

Samodzielny pakiet zawiera widok sali (`src/`), panel administratora (`admin/`), wspólny model danych (`shared/`) i mały serwer cache (`cache/`). Obraz Nginx serwuje oba interfejsy jako pliki statyczne. Osobny kontener Node.js pobiera plany i zapisuje JSON; nie potrzebuje PostgreSQL ani zależności npm.

Dokumentacja: [obsługa](docs/UZYTKOWANIE.md), [cache i kopie](docs/CACHE.md), [pliki i funkcje](docs/KOD.md), [testy](../docs/WERYFIKACJA.md), [pełny projekt](../README.md). Odnośniki nadrzędne działają w pełnym repozytorium; do wdrożenia wystarcza ten katalog.

## Samodzielne wdrożenie

Wymagane: Docker z BuildKit, Compose v2 z `--wait`; Windows — Docker Desktop z kontenerami Linux i dostępem do folderu projektu. Polecenia wykonuj w `frontend/`.

Utwórz `.env` z `.env.example` (Bash: `cp .env.example .env`, PowerShell: `Copy-Item .env.example .env`). Nie nadpisuj istniejącej konfiguracji. Przykład:

```dotenv
BACKEND_URL=http://192.168.1.20:3001
FRONTEND_PORT=5173
TABLET_ROOM_ID=205
CACHE_ADMIN_TOKEN=wstaw-wlasny-dlugi-token-kopii
APP_TIMEZONE=Europe/Warsaw
CACHE_ROOM_IDS=205,30
CACHE_REFRESH_SECONDS=60
CACHE_TIMEOUT_SECONDS=5
```

```bash
docker compose config --quiet
docker compose up -d --build --wait
docker compose ps
```

`BACKEND_URL` musi być osiągalny **z kontenerów**, zawierać http:// lub https://, host i opcjonalny port, bez ścieżki, danych logowania, query, fragmentu i końcowego `/`. `localhost` w kontenerze oznacza ten kontener. Backend na hoście Docker Desktop można wskazać jego osiągalnym adresem lub odpowiednio skonfigurowanym `host.docker.internal`; dostarczony Linux Compose nie dodaje takiego mapowania automatycznie.

Frontend nie zależy od health głównego API. Potrzebuje zdrowej lokalnej usługi cache. Może wystartować bez backendu, lecz plan będzie dostępny dopiero po wcześniejszym pobraniu lub imporcie zgodnego JSON-u. Budowanie obrazu nadal wymaga dostępnych obrazów bazowych i zależności npm albo ich lokalnej pamięci budowania.

## Adresy i proxy

| Adres | Obsługa |
| --- | --- |
| `/` | Przekierowanie do sali z `TABLET_ROOM_ID`; bez ustawienia komunikat o braku przypisania |
| `/room/205` | Widok sali, numer z URL ma pierwszeństwo |
| `/admin` | 301 do `/admin/` |
| `/admin/` | Osobna aplikacja panelu, trasy pod tym prefiksem |
| `/api/room/:roomId` | Proxy do `cache:3002` |
| `/api/cache/backup`, `/api/cache/import` | Proxy do cache, Bearer, limit importu 8 MiB |
| Pozostałe `/api` i `/api/*` | Proxy do `BACKEND_URL`, pełna oryginalna ścieżka |
| `/healthz` | 200 `ok`, sam Nginx, bez zapytania do API |

Przeglądarka: `http://ADRES_WWW:5173/room/205` oraz `http://ADRES_WWW:5173/admin/`. Panel we wdrożeniu korzysta z tego samego portu; 5174 służy jedynie oddzielnemu serwerowi developerskiemu.

Nginx obsługuje fallback SPA do właściwego `index.html` dla obu aplikacji; brakujący statyczny zasób js/css/obraz/font daje 404. Jawna reguła `index.html` ustawia `Cache-Control: no-cache`. Nie skonfigurowano długotrwałego cache immutable ani kompresji w szablonie projektu. DNS Dockera `127.0.0.11` jest odświeżany z ważnością 30 s. Zmienna w `proxy_pass` pozwala wystartować bez dostępnego hosta API. Szablon jest przeznaczony do Dockera, nie do bezpośredniego skopiowania na dowolny host Nginx bez adaptacji DNS.

## Konfiguracja — kiedy działa zmiana

| Zmienna | Domyślnie / wymaganie | Moment i znaczenie |
| --- | --- | --- |
| `BACKEND_URL` | Wymagana w osobnym Compose | Runtime Nginx i cache; źródło planów i proxy panelu |
| `FRONTEND_PORT` | 5173 | Publikacja portu hosta |
| `TABLET_ROOM_ID` | Puste w Compose, 205 w przykładzie `.env` | Argument buildu ustawiający `VITE_ROOM_ID`; domyślna sala |
| `API_SETTINGS_PASSWORD` | Domyślnie CACHE_ADMIN_TOKEN | Runtime cache; hasło otwierające edycję w oknie API |
| `CACHE_ADMIN_TOKEN` | Wymagana w osobnym Compose | Runtime cache, import/eksport; we wspólnym Compose fallback do `ADMIN_TOKEN`, potem placeholdera |
| `APP_TIMEZONE` | Europe/Warsaw | Runtime cache, data dnia i statusy |
| `CACHE_ROOM_IDS` | Fallback do TABLET_ROOM_ID | CSV sal pobieranych od startu plus sale znane z zapisów |
| `CACHE_REFRESH_SECONDS` | 60, zakres 5–86400 | Okres odświeżania i ważności prób |
| `CACHE_TIMEOUT_SECONDS` | 5, zakres 1–30 | Limit oczekiwania cache na upstream |
| `CACHE_DIR` | `/data` w obrazie; `./.cache` w server.mjs | Proces cache; do użycia własnej wartości zmień environment i mount usługi |
| `CACHE_MAX_ENTRIES` | 500, zakres 1–5000 | Proces cache; obecne Compose nie przekazuje tej zmiennej |
| `PORT` | 3002 w cache, zakres 1–65535 | Wewnętrzny port; zmiana wymaga dopasowania proxy i healthchecku |
| `CACHE_URL` | http://localhost:3002 | Tylko proxy Vite widoku sali |
| `VITE_ROOM_ID` | Puste | Build/dev widoku sali; odpowiednik argumentu TABLET_ROOM_ID |
| `VITE_PUBLIC_APP_BASE_URL` | Origin przeglądarki | Build/dev panelu, przycisk „Widok sali” |
| `VITE_PROXY_TARGET` | http://localhost:3001 jako ostateczny fallback | Zastępczy cel Vite, gdy brak BACKEND_URL |

`VITE_API_BASE_URL` nie jest odczytywane. Wartości `VITE_*` są wbudowywane do JS i nie są miejscem na sekrety. `VITE_PUBLIC_APP_BASE_URL` nie jest obecnie przekazywane jako argument Dockerfile, więc wdrożony panel domyślnie używa swojego originu.

Po zmianie backendu: `docker compose up -d --force-recreate frontend cache`. Zmienia się także wybierany plik cache, jeśli zmienił się znormalizowany origin. Po zmianie domyślnej sali: `docker compose up -d --build frontend cache` (cache dostanie nowy fallback sal). Po zmianie tokenu kopii odtwórz cache. Sam `restart` nie aktualizuje zmiennych.

## Lokalny cache JSON

Dane są w zwykłym folderze `cache-data/` obok tego README. Główne Compose montuje `./frontend/cache-data`, osobne `./cache-data`; oba wskazują ten sam folder w pełnym projekcie. W kontenerze to `/data/plans-<hash>.json`. Hash jest pierwszymi 20 znakami SHA-256 znormalizowanego originu API.

| Umieszczenie projektu | Plik na komputerze |
| --- | --- |
| Windows, `C:/tablet_app_web` | `C:/tablet_app_web/frontend/cache-data/plans-<hash>.json` |
| Linux, `/home/user/tablet_app_web` | `/home/user/tablet_app_web/frontend/cache-data/plans-<hash>.json` |

Ścieżki względne i [bind mounty Docker Desktop](https://docs.docker.com/engine/storage/bind-mounts/) pozwalają użyć tej samej konfiguracji na obu systemach. To opis konfiguracji; natywne działanie Windows nie jest potwierdzone testem w tym środowisku. Linux i scenariusze różnych UID sprawdzono testami. Folder musi być zapisywalny i udostępniony Dockerowi.

JSON pozostaje po odtworzeniu kontenerów. Przy przenoszeniu offline skopiuj również folder danych i zachowaj to samo źródło. Git i build ignorują dane; samo pobranie repo nie pobiera zapisanych planów. `.gitkeep` jedynie zachowuje pusty katalog. Dokładny algorytm, uprawnienia, błędy, format i import: [CACHE.md](docs/CACHE.md).

## Hasło ustawień i pierwsza instalacja

Hasło nie jest losowane automatycznie i nie powstaje osobny plik haseł. Przygotowujesz `.env` z `.env.example`; Compose przekazuje konfigurację do środowiska cache. Kolejność: niepuste API_SETTINGS_PASSWORD, potem CACHE_ADMIN_TOKEN; we wspólnym Compose token kopii domyślnie pochodzi z ADMIN_TOKEN.

| Wariant bez zmiany przykładów | Plik przygotowany przez użytkownika | Hasło okna API |
| --- | --- | --- |
| Cały projekt | Główne `.env`, ADMIN_TOKEN z przykładu | `change-me-admin-token` |
| Sam frontend | `frontend/.env`, CACHE_ADMIN_TOKEN z przykładu | `wstaw-wlasny-dlugi-token` |
| Własne hasło | API_SETTINGS_PASSWORD w odpowiednim `.env` | Dokładnie podana wartość |

Przykładowe sekrety należy zastąpić własnymi podczas konfiguracji. Aby dać oknu API osobne hasło, dodaj `API_SETTINGS_PASSWORD=twoje-wlasne-haslo` do `.env` używanego Compose i wykonaj z jego katalogu:

```bash
docker compose up -d --no-deps --force-recreate --wait cache
```

Nie trzeba przebudowywać frontendu. Zamknij wcześniej otwarte ustawienia i otwórz je ponownie, aby sprawdzić nowe hasło; już odsłoniętego edytora zmiana środowiska nie zamyka zdalnie. Hasło panelu administratora nadal pochodzi z ADMIN_TOKEN, a import/eksport nadal wymaga CACHE_ADMIN_TOKEN. Tylko brak osobnych wartości powoduje ich dziedziczenie w głównym Compose.

## Endpoint wybierany w przeglądarce

Przycisk **API** najpierw prosi o hasło. Weryfikuje je lokalny cache przez `POST /api/cache/settings/unlock`, także bez głównego backendu. Hasło ustawia się w `API_SETTINGS_PASSWORD`; pusta lub nieustawiona wartość oznacza użycie `CACHE_ADMIN_TOKEN`. Po zamknięciu okna ponownie trzeba się uwierzytelnić. Aplikacja nie utrwala hasła ani odblokowania w localStorage/sessionStorage; sekret nie jest wbudowany w JS. Pięć błędnych prób w ciągu minuty blokuje sprawdzanie na 30 s. Zmiana hasła wymaga odtworzenia cache.

Po odblokowaniu można zmienić endpoint danych sali, np. `/api/room/{roomId}` lub `https://serwer.example/api/room/{roomId}`. Znacznik zastępowany jest kodem z URL, z kodowaniem URI. Zapis działa od razu, przechowywany jest pod `room_tablet_api_endpoint` w localStorage i synchronizowany między kartami.

Domyślny endpoint korzysta z cache. Inny jest wywoływany bezpośrednio z przeglądarki; nawet absolutny URL wskazujący ten sam zasób nie jest traktowany przez klienta jako dokładny domyślny szablon. Zewnętrzny serwer musi dopuszczać CORS. Strona HTTPS wymaga endpointu HTTPS. Przywrócenie domyślnego adresu usuwa zapisane nadpisanie. Brak dostępu do localStorage pozostawia zmianę tylko w bieżącej karcie.

Zmiana endpointu nie zmienia `BACKEND_URL`, źródła cache ani API panelu administratora. Import/eksport nadal trafia do lokalnego `/api/cache/*`.

## Rozwój bez Dockera

Użyj aktualnego Node.js 22 (dla całego projektu minimum 22.12). `cache:dev` używa flagi `--env-file-if-exists`, dostępnej od Node 22.9 ([dokumentacja Node](https://nodejs.org/download/release/v22.23.0/docs/api/cli.html)).

W `frontend/.env` ustaw BACKEND_URL i token kopii. Aby root `/` wskazywał salę w Vite, dopisz `VITE_ROOM_ID=205`; `TABLET_ROOM_ID` jest argumentem Dockera i Vite nie odczytuje go bezpośrednio.

Terminal 1, w `frontend/`:

```bash
npm run cache:dev
```

Nie wymaga instalacji zależności. Domyślny zapis jest w `.cache/`. Aby użyć tego samego folderu co Compose, dopisz `CACHE_DIR=./cache-data` do `.env`; nie uruchamiaj dwóch procesów zapisujących ten sam plik jednocześnie.

Terminal 2, w `frontend/`:

```bash
npm ci
npm run dev
```

Terminal 3, w `frontend/admin/`:

```bash
npm ci
npm run dev
```

Panel Vite wczytuje zmienne ze swojego katalogu, a nie automatycznie z `frontend/.env`. Dla zdalnego API przygotuj `frontend/admin/.env.local` z BACKEND_URL i ewentualnie `VITE_PUBLIC_APP_BASE_URL=http://localhost:5173`. Domyślnie wskazuje lokalne API 3001. Główny backend musi być uruchomiony osobno.

Adresy dev: `http://localhost:5173/room/205`, `http://localhost:5174/admin/`. Vite przekazuje `/api/room/` i `/api/cache/` do cache, pozostałe API do backendu. Serwer Vite uruchamia się na 0.0.0.0. Jeśli wybrany port jest zajęty, Vite może wybrać następny — sprawdź komunikat startowy.

## Skrypty i build

| Pakiet/skrypt | Działanie |
| --- | --- |
| frontend `dev` | Vite 5173 |
| frontend `build` | `tsc && vite build`, wynik `dist/` |
| frontend `preview` | Podgląd buildu na 4173, host 0.0.0.0 |
| frontend `cache:dev` | Node ładuje opcjonalne `.env` i uruchamia `cache/server.mjs` |
| frontend `test:cache` | Testy modelu i cache przez `node --test` |
| admin `dev` | Vite 5174 |
| admin `build` | `tsc && vite build`, wynik `admin/dist/` |
| admin `preview` | Podgląd na 4174, host 0.0.0.0 |

Z katalogu frontendu:

```bash
npm run build
npm run build --prefix admin
npm run test:cache
```

`preview` nie zastępuje wdrożonego Nginx z konfiguracją proxy; nie zakładaj działającego `/api` bez osobnego routingu. Dockerfile wykonuje oba buildy, kopiuje publiczny do `/usr/share/nginx/html`, panel do `/usr/share/nginx/html/admin`. Wynik statyczny można serwować inaczej po odtworzeniu odpowiednich fallbacków i proxy; sama usługa hostingu statycznego nie zapisze pliku JSON.

## Obsługa i problemy

```bash
docker compose logs --tail=100 frontend cache
docker compose exec -T frontend nginx -t
docker compose exec -T cache node -e "fetch('http://127.0.0.1:3002/healthz').then(r=>r.json()).then(console.log)"
docker compose down
```

Nginx i cache mają healthcheck co 10 s, timeout 3 s, 5 prób, okres startowy 5 s. Cache health raportuje liczbę snapshotów, nie stan głównego backendu.

| Objaw | Sprawdzenie |
| --- | --- |
| `/` bez planu | TABLET_ROOM_ID przy buildzie lub wejdź na `/room/KOD` |
| 503 i brak kopii | Czy sala była pobrana, prawidłowy BACKEND_URL, folder i hash źródła |
| Po zmianie URL brak starych danych | Każdy origin ma osobny plik; kopia wymaga tego samego source |
| Niepoprawny format planu | JSON musi spełniać model sali, dnia i godzin; HTML API nie jest planem |
| 502 z proxy | Usługa cache, DNS, log Nginx; pozostałe API — połączenie z backendem |
| Import 401/503 | Token CACHE_ADMIN_TOKEN, nie przypadkowy token panelu; konfiguracja usługi |
| Import 400/413/415 | Format/source/walidacja, maks. 8 MiB, application/json |
| Cache nie startuje | Walidacja originu, strefy, zakresów liczb i dostęp do folderu |
| Brak dostępu do folderu na Windows | Udostępnienie katalogu Docker Desktop i prawa dostępu; szczegóły CACHE.md |
| Panel po restarcie bez backendu nie działa | Panel nie ma trybu edycji offline; weryfikacja sesji wymaga API |

UI zegara sali i formatowanie godzin są obecnie ustawione na Europe/Warsaw w kodzie, nawet gdy cache ma inną strefę. Panel używa lokalnej strefy przeglądarki. Pełne konsekwencje i użytkowanie: [instrukcja](docs/UZYTKOWANIE.md).
