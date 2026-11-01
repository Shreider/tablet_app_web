# Spis plików projektu

[Przewodnik](../README.md) · [Funkcje backendu](../backend/docs/KOD.md) · [Funkcje frontendu](../frontend/docs/KOD.md)

Indeks obejmuje wszystkie 150 plików kodu, konfiguracji, testów i dokumentacji w aktualnym repozytorium. Ścieżki są względem jego korzenia. Link nazwy otwiera plik; „Opis” prowadzi do odpowiedniej części dokumentacji. Zależności, buildy, sekrety i aktywne dane omówiono na końcu.

## Katalog główny i dokumentacja wspólna

| Plik | Odpowiedzialność | Dokumentacja |
| --- | --- | --- |
| [.env.example](../.env.example) | Szablon zmiennych dla właściwego wariantu Compose. | [Opis](../README.md) |
| [.gitignore](../.gitignore) | Wykluczenia Git, w tym dane i sekrety. | [Opis](../README.md) |
| [DZIENNIK_PRAKTYK_27.10.2025-21.04.2026.md](../DZIENNIK_PRAKTYK_27.10.2025-21.04.2026.md) | Historyczny dziennik praktyk; zachowany bez redakcji. | [Opis](../README.md) |
| [README.md](../README.md) | Przewodnik całego projektu i mapa dokumentacji. | [Opis](../README.md) |
| [docker-compose.yml](../docker-compose.yml) | Usługi pakietu, środowisko, sieci, porty, healthchecki i magazyny danych. | [Opis](../README.md) |
| [docs/PLIKI.md](../docs/PLIKI.md) | Ten pełny indeks plików. | [Opis](../README.md) |
| [docs/WERYFIKACJA.md](../docs/WERYFIKACJA.md) | Testy, procedury sprawdzenia i granice weryfikacji. | [Opis](../README.md) |

## Backend

| Plik | Odpowiedzialność | Dokumentacja |
| --- | --- | --- |
| [backend/.dockerignore](../backend/.dockerignore) | Wykluczenia kontekstu budowania obrazu: zależności, wyniki i lokalna konfiguracja. | [Opis](../backend/README.md) |
| [backend/.env.example](../backend/.env.example) | Szablon zmiennych dla właściwego wariantu Compose. | [Opis](../backend/README.md) |
| [backend/Dockerfile](../backend/Dockerfile) | Budowanie obrazu, instalacja zależności i polecenie startu. | [Opis](../backend/README.md) |
| [backend/README.md](../backend/README.md) | Instalacja i utrzymanie API, konfiguracja, skrypty i diagnoza. | [Opis](../backend/README.md) |
| [backend/database/README.md](../backend/database/README.md) | Model PostgreSQL, migracje, role, dane początkowe i kopie. | [Opis](../backend/database/README.md) |
| [backend/database/init/001_schema.sql](../backend/database/init/001_schema.sql) | Informacja o utrzymywaniu schematu przez Prisma; nie tworzy tabel. | [Opis](../backend/database/README.md) |
| [backend/database/init/002_web_app_role.sql](../backend/database/init/002_web_app_role.sql) | Inicjalizacja roli odczytu web_app oraz CONNECT/USAGE. | [Opis](../backend/database/README.md) |
| [backend/docker-compose.yml](../backend/docker-compose.yml) | Usługi pakietu, środowisko, sieci, porty, healthchecki i magazyny danych. | [Opis](../backend/README.md) |
| [backend/docs/API.md](../backend/docs/API.md) | Kontrakt wszystkich endpointów głównego backendu. | [Opis](../backend/README.md) |
| [backend/docs/KOD.md](../backend/docs/KOD.md) | Referencja warstw, plików, typów i nazwanych funkcji backendu. | [Opis](../backend/README.md) |
| [backend/package-lock.json](../backend/package-lock.json) | Dokładny graf wersji zależności dla npm ci. | [Opis](../backend/README.md) |
| [backend/package.json](../backend/package.json) | Zależności pakietu i skrypty npm. | [Opis](../backend/README.md) |
| [backend/prisma.config.ts](../backend/prisma.config.ts) | Konfiguracja Prisma CLI: dotenv, schemat, migracje, seed i URL. | [Opis](../backend/README.md) |
| [backend/prisma/migrations/20260329183000_init/migration.sql](../backend/prisma/migrations/20260329183000_init/migration.sql) | Pierwsze tabele sal i zajęć, indeksy, CHECK czasu i granty. | [Opis](../backend/database/README.md) |
| [backend/prisma/migrations/20260329194000_normalize_reference_entities/migration.sql](../backend/prisma/migrations/20260329194000_normalize_reference_entities/migration.sql) | Normalizacja słowników, migracja tekstów do relacji i indeksy. | [Opis](../backend/database/README.md) |
| [backend/prisma/migrations/20260330120000_remove_wings_entity/migration.sql](../backend/prisma/migrations/20260330120000_remove_wings_entity/migration.sql) | Usunięcie tabeli wings, tymczasowe zachowanie tekstu skrzydła sali. | [Opis](../backend/database/README.md) |
| [backend/prisma/migrations/20260330130000_drop_room_wing_column/migration.sql](../backend/prisma/migrations/20260330130000_drop_room_wing_column/migration.sql) | Usunięcie również tekstowej kolumny skrzydła. | [Opis](../backend/database/README.md) |
| [backend/prisma/migrations/migration_lock.toml](../backend/prisma/migrations/migration_lock.toml) | Dostawca migracji PostgreSQL. | [Opis](../backend/database/README.md) |
| [backend/prisma/schema.prisma](../backend/prisma/schema.prisma) | Dziewięć modeli Prisma, relacje, mapowania i indeksy. | [Opis](../backend/database/README.md) |
| [backend/prisma/seed.ts](../backend/prisma/seed.ts) | Transakcyjne zastąpienie danych aplikacji zestawem demonstracyjnym. | [Opis](../backend/database/README.md) |
| [backend/src/config/env.ts](../backend/src/config/env.ts) | Odczyt zmiennych procesu i domyślnych wartości API. | [Opis](../backend/docs/KOD.md) |
| [backend/src/controllers/admin/adminAuthController.ts](../backend/src/controllers/admin/adminAuthController.ts) | Logowanie tokenem i weryfikacja sesji. | [Opis](../backend/docs/KOD.md) |
| [backend/src/controllers/admin/adminConflictsController.ts](../backend/src/controllers/admin/adminConflictsController.ts) | Odczyt par konfliktów. | [Opis](../backend/docs/KOD.md) |
| [backend/src/controllers/admin/adminControllerUtils.ts](../backend/src/controllers/admin/adminControllerUtils.ts) | Wspólne mapowanie błędów walidacji/Prisma/SQL na HTTP. | [Opis](../backend/docs/KOD.md) |
| [backend/src/controllers/admin/adminDashboardController.ts](../backend/src/controllers/admin/adminDashboardController.ts) | Statystyki, ostatnie rekordy i ostrzeżenia. | [Opis](../backend/docs/KOD.md) |
| [backend/src/controllers/admin/adminReferencesController.ts](../backend/src/controllers/admin/adminReferencesController.ts) | Walidacja i CRUD słowników oraz zależności. | [Opis](../backend/docs/KOD.md) |
| [backend/src/controllers/admin/adminRoomsController.ts](../backend/src/controllers/admin/adminRoomsController.ts) | Walidacja, lista, opcje, szczegóły i CRUD sal. | [Opis](../backend/docs/KOD.md) |
| [backend/src/controllers/admin/adminScheduleEntriesController.ts](../backend/src/controllers/admin/adminScheduleEntriesController.ts) | Walidacja, filtry, opcje i CRUD zajęć. | [Opis](../backend/docs/KOD.md) |
| [backend/src/controllers/healthController.ts](../backend/src/controllers/healthController.ts) | Publiczny health z SELECT 1. | [Opis](../backend/docs/KOD.md) |
| [backend/src/controllers/roomController.ts](../backend/src/controllers/roomController.ts) | Publiczny plan sali, ścisły parametr date i błędy. | [Opis](../backend/docs/KOD.md) |
| [backend/src/controllers/roomsController.ts](../backend/src/controllers/roomsController.ts) | Publiczna lista sal. | [Opis](../backend/docs/KOD.md) |
| [backend/src/controllers/scheduleController.ts](../backend/src/controllers/scheduleController.ts) | Publiczny plan zbiorczy lub plan wskazanej sali. | [Opis](../backend/docs/KOD.md) |
| [backend/src/db/prisma.ts](../backend/src/db/prisma.ts) | Dwa klienty Prisma z adapterami pg i zamknięcie pul. | [Opis](../backend/docs/KOD.md) |
| [backend/src/db/time.ts](../backend/src/db/time.ts) | Bieżący dzień i minuty w skonfigurowanej strefie. | [Opis](../backend/docs/KOD.md) |
| [backend/src/index.ts](../backend/src/index.ts) | Start Express, CORS/JSON, router, błędy i zamykanie po sygnałach. | [Opis](../backend/docs/KOD.md) |
| [backend/src/middleware/adminAuth.ts](../backend/src/middleware/adminAuth.ts) | Odczyt i bezpieczne porównanie tokenu; ochrona tras admina. | [Opis](../backend/docs/KOD.md) |
| [backend/src/repositories/admin/adminConflictsRepository.ts](../backend/src/repositories/admin/adminConflictsRepository.ts) | Pobranie wpisów i porównanie nakładających się par sali/dnia. | [Opis](../backend/docs/KOD.md) |
| [backend/src/repositories/admin/adminDashboardRepository.ts](../backend/src/repositories/admin/adminDashboardRepository.ts) | Zapytania liczników, konfliktów i ostatnich rekordów. | [Opis](../backend/docs/KOD.md) |
| [backend/src/repositories/admin/adminReferenceRepository.ts](../backend/src/repositories/admin/adminReferenceRepository.ts) | Zapytania i zapis słowników, istnienie oraz zależności. | [Opis](../backend/docs/KOD.md) |
| [backend/src/repositories/admin/adminRoomsRepository.ts](../backend/src/repositories/admin/adminRoomsRepository.ts) | Filtrowanie, sortowanie, paginacja i zapis sal, opcje i wpisy zależne. | [Opis](../backend/docs/KOD.md) |
| [backend/src/repositories/admin/adminScheduleEntriesRepository.ts](../backend/src/repositories/admin/adminScheduleEntriesRepository.ts) | Filtrowanie i zapis wpisów oraz aktywne opcje słowników. | [Opis](../backend/docs/KOD.md) |
| [backend/src/repositories/roomRepository.ts](../backend/src/repositories/roomRepository.ts) | Publiczne zapytania o sale i harmonogram z relacjami. | [Opis](../backend/docs/KOD.md) |
| [backend/src/routes/admin/adminAuthRoutes.ts](../backend/src/routes/admin/adminAuthRoutes.ts) | POST login i GET session. | [Opis](../backend/docs/KOD.md) |
| [backend/src/routes/admin/adminConflictsRoutes.ts](../backend/src/routes/admin/adminConflictsRoutes.ts) | GET conflicts. | [Opis](../backend/docs/KOD.md) |
| [backend/src/routes/admin/adminDashboardRoutes.ts](../backend/src/routes/admin/adminDashboardRoutes.ts) | GET dashboard. | [Opis](../backend/docs/KOD.md) |
| [backend/src/routes/admin/adminReferencesRoutes.ts](../backend/src/routes/admin/adminReferencesRoutes.ts) | Trasy dataset/dependencies i CRUD references. | [Opis](../backend/docs/KOD.md) |
| [backend/src/routes/admin/adminRoomsRoutes.ts](../backend/src/routes/admin/adminRoomsRoutes.ts) | Trasy list/options/details i CRUD rooms. | [Opis](../backend/docs/KOD.md) |
| [backend/src/routes/admin/adminScheduleEntriesRoutes.ts](../backend/src/routes/admin/adminScheduleEntriesRoutes.ts) | Trasy list/options/details i CRUD schedule-entries. | [Opis](../backend/docs/KOD.md) |
| [backend/src/routes/adminRoutes.ts](../backend/src/routes/adminRoutes.ts) | Łączenie grup admina i montowanie middleware tokenu. | [Opis](../backend/docs/KOD.md) |
| [backend/src/routes/apiRoutes.ts](../backend/src/routes/apiRoutes.ts) | Łączenie wszystkich grup pod /api. | [Opis](../backend/docs/KOD.md) |
| [backend/src/routes/healthRoutes.ts](../backend/src/routes/healthRoutes.ts) | GET /api/health. | [Opis](../backend/docs/KOD.md) |
| [backend/src/routes/roomRoutes.ts](../backend/src/routes/roomRoutes.ts) | GET /api/room/:roomId. | [Opis](../backend/docs/KOD.md) |
| [backend/src/routes/roomsRoutes.ts](../backend/src/routes/roomsRoutes.ts) | GET /api/rooms. | [Opis](../backend/docs/KOD.md) |
| [backend/src/routes/scheduleRoutes.ts](../backend/src/routes/scheduleRoutes.ts) | GET /api/schedule. | [Opis](../backend/docs/KOD.md) |
| [backend/src/seed/seedRooms.ts](../backend/src/seed/seedRooms.ts) | Typy i dane demonstracyjne pięciu sal oraz 25 zajęć. | [Opis](../backend/docs/KOD.md) |
| [backend/src/services/roomService.ts](../backend/src/services/roomService.ts) | Złożenie planu jednej sali, dnia i wskaźników current/next. | [Opis](../backend/docs/KOD.md) |
| [backend/src/services/roomsService.ts](../backend/src/services/roomsService.ts) | Lista sal z metadanymi i czasem wygenerowania. | [Opis](../backend/docs/KOD.md) |
| [backend/src/services/schedulePresentation.ts](../backend/src/services/schedulePresentation.ts) | Mapowanie publicznego DTO i obliczanie statusu zajęć. | [Opis](../backend/docs/KOD.md) |
| [backend/src/services/scheduleService.ts](../backend/src/services/scheduleService.ts) | Walidacja filtra daty i złożenie planu zbiorczego. | [Opis](../backend/docs/KOD.md) |
| [backend/src/types/domain.ts](../backend/src/types/domain.ts) | Wewnętrzne rekordy, payloady, statystyki i paginacja. | [Opis](../backend/docs/KOD.md) |
| [backend/src/types/errors.ts](../backend/src/types/errors.ts) | Tworzenie błędu z kodem maszynowym. | [Opis](../backend/docs/KOD.md) |
| [backend/src/types/express.d.ts](../backend/src/types/express.d.ts) | Typ req.adminAuth dla middleware Express. | [Opis](../backend/docs/KOD.md) |
| [backend/src/utils/adminMappers.ts](../backend/src/utils/adminMappers.ts) | Rekordy repozytoriów do DTO panelu i opcji formularzy. | [Opis](../backend/docs/KOD.md) |
| [backend/src/utils/adminValidation.ts](../backend/src/utils/adminValidation.ts) | Walidacja tekstów, liczb, flag, dat, czasu i paginacji. | [Opis](../backend/docs/KOD.md) |
| [backend/src/utils/prismaDate.ts](../backend/src/utils/prismaDate.ts) | Konwersje SQL DATE/TIME i formatów API. | [Opis](../backend/docs/KOD.md) |
| [backend/test/roomApi.integration.test.ts](../backend/test/roomApi.integration.test.ts) | Sześć testów rzeczywistego HTTP i dedykowanej bazy PostgreSQL. | [Opis](../backend/docs/KOD.md) |
| [backend/tsconfig.json](../backend/tsconfig.json) | Zakres źródeł i opcje kompilacji TypeScript. | [Opis](../backend/README.md) |

## Frontend, panel i cache

| Plik | Odpowiedzialność | Dokumentacja |
| --- | --- | --- |
| [frontend/.dockerignore](../frontend/.dockerignore) | Wykluczenia kontekstu budowania obrazu: zależności, wyniki i lokalna konfiguracja. | [Opis](../frontend/README.md) |
| [frontend/.env.example](../frontend/.env.example) | Szablon zmiennych dla właściwego wariantu Compose. | [Opis](../frontend/README.md) |
| [frontend/Dockerfile](../frontend/Dockerfile) | Budowanie obrazu, instalacja zależności i polecenie startu. | [Opis](../frontend/README.md) |
| [frontend/README.md](../frontend/README.md) | Instalacja i konfiguracja obu interfejsów oraz usługi cache. | [Opis](../frontend/README.md) |
| [frontend/admin/index.html](../frontend/admin/index.html) | Dokument startowy interfejsu z elementem root i modułem wejścia. | [Opis](../frontend/README.md) |
| [frontend/admin/package-lock.json](../frontend/admin/package-lock.json) | Dokładny graf wersji zależności dla npm ci. | [Opis](../frontend/README.md) |
| [frontend/admin/package.json](../frontend/admin/package.json) | Zależności pakietu i skrypty npm. | [Opis](../frontend/README.md) |
| [frontend/admin/src/admin/api/adminApi.ts](../frontend/admin/src/admin/api/adminApi.ts) | Wszystkie wywołania API panelu i obsługa błędów. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/src/admin/auth/AdminAuthContext.tsx](../frontend/admin/src/admin/auth/AdminAuthContext.tsx) | Sesja w sessionStorage, logowanie i wylogowanie. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/src/admin/components/AdminDialog.tsx](../frontend/admin/src/admin/components/AdminDialog.tsx) | Dialog/drawer panelu z busy i stopką. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/src/admin/components/AdminIcon.tsx](../frontend/admin/src/admin/components/AdminIcon.tsx) | Wewnętrzne SVG panelu. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/src/admin/components/AdminLayout.tsx](../frontend/admin/src/admin/components/AdminLayout.tsx) | Menu, nagłówek, zegar i obszar stron. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/src/admin/components/AdminProtectedRoute.tsx](../frontend/admin/src/admin/components/AdminProtectedRoute.tsx) | Kontrola stanu sesji i przekierowanie logowania. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/src/admin/components/AdminUi.tsx](../frontend/admin/src/admin/components/AdminUi.tsx) | Panele, stany, paginacja, badge, potwierdzenia i formatowanie. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/src/admin/config/adminNavigation.ts](../frontend/admin/src/admin/config/adminNavigation.ts) | Menu, sekcje słowników, tytuły i kontekst trasy. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/src/admin/pages/AdminCatalogPage.tsx](../frontend/admin/src/admin/pages/AdminCatalogPage.tsx) | Wspólny CRUD sześciu słowników i kontrola zależności. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/src/admin/pages/AdminConflictsPage.tsx](../frontend/admin/src/admin/pages/AdminConflictsPage.tsx) | Pary konfliktów oraz edycja wskazanego wpisu. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/src/admin/pages/AdminDashboardPage.tsx](../frontend/admin/src/admin/pages/AdminDashboardPage.tsx) | Statystyki, ostrzeżenia, skróty i ostatnie zajęcia. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/src/admin/pages/AdminLoginPage.tsx](../frontend/admin/src/admin/pages/AdminLoginPage.tsx) | Formularz tokenu i powrót do chronionej trasy. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/src/admin/pages/AdminRoomsPage.tsx](../frontend/admin/src/admin/pages/AdminRoomsPage.tsx) | Lista/filtry, formularze, szczegóły i usuwanie sal. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/src/admin/pages/AdminScheduleEntriesPage.tsx](../frontend/admin/src/admin/pages/AdminScheduleEntriesPage.tsx) | Lista/filtry, formularze, szczegóły i usuwanie zajęć. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/src/admin/types.ts](../frontend/admin/src/admin/types.ts) | DTO administratora, opcje, paginacja, słowniki i konflikty. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/src/index.css](../frontend/admin/src/index.css) | Style układu, komponentów, responsywności i preferencji ruchu. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/src/main.tsx](../frontend/admin/src/main.tsx) | Montaż panelu, sesja i router pod /admin/. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/src/vite-env.d.ts](../frontend/admin/src/vite-env.d.ts) | Deklaracje typów środowiska Vite. | [Opis](../frontend/docs/KOD.md) |
| [frontend/admin/tailwind.config.ts](../frontend/admin/tailwind.config.ts) | Zakres skanowania klas i ustawienia Tailwind. | [Opis](../frontend/README.md) |
| [frontend/admin/tsconfig.json](../frontend/admin/tsconfig.json) | Zakres źródeł i opcje kompilacji TypeScript. | [Opis](../frontend/README.md) |
| [frontend/admin/vite.config.ts](../frontend/admin/vite.config.ts) | Build Vite, proxy developerskie i port interfejsu. | [Opis](../frontend/README.md) |
| [frontend/cache-data/.gitkeep](../frontend/cache-data/.gitkeep) | Zachowanie pustego folderu w repo; dane nie są wersjonowane. | [Opis](../frontend/docs/CACHE.md) |
| [frontend/cache/Dockerfile](../frontend/cache/Dockerfile) | Obraz usługi cache bez instalacji zależności npm. | [Opis](../frontend/docs/CACHE.md) |
| [frontend/cache/entrypoint.mjs](../frontend/cache/entrypoint.mjs) | Przygotowanie katalogu i UID/GID, obniżenie uprawnień i start HTTP. | [Opis](../frontend/docs/CACHE.md) |
| [frontend/cache/server.mjs](../frontend/cache/server.mjs) | HTTP cache, hasło ustawień, autoryzacja kopii i odświeżanie. | [Opis](../frontend/docs/CACHE.md) |
| [frontend/cache/store.mjs](../frontend/cache/store.mjs) | FileCache: walidacja, kolejka, plik JSON i import. | [Opis](../frontend/docs/CACHE.md) |
| [frontend/cache/test/cache.test.mjs](../frontend/cache/test/cache.test.mjs) | Testy awarii, restartu, kopii, hasła i UID katalogów. | [Opis](../frontend/docs/CACHE.md) |
| [frontend/docker-compose.yml](../frontend/docker-compose.yml) | Usługi pakietu, środowisko, sieci, porty, healthchecki i magazyny danych. | [Opis](../frontend/README.md) |
| [frontend/docker-entrypoint.d/19-validate-backend-url.sh](../frontend/docker-entrypoint.d/19-validate-backend-url.sh) | Walidacja BACKEND_URL przed podstawieniem do szablonu Nginx. | [Opis](../frontend/README.md) |
| [frontend/docs/CACHE.md](../frontend/docs/CACHE.md) | Trwały JSON, format kopii, uprawnienia, algorytm i API cache. | [Opis](../frontend/README.md) |
| [frontend/docs/KOD.md](../frontend/docs/KOD.md) | Referencja komponentów, hooków, typów i funkcji frontendu. | [Opis](../frontend/README.md) |
| [frontend/docs/UZYTKOWANIE.md](../frontend/docs/UZYTKOWANIE.md) | Obsługa ekranu sali, ustawień, kopii i wszystkich ekranów panelu. | [Opis](../frontend/README.md) |
| [frontend/index.html](../frontend/index.html) | Dokument startowy interfejsu z elementem root i modułem wejścia. | [Opis](../frontend/README.md) |
| [frontend/nginx/default.conf.template](../frontend/nginx/default.conf.template) | Proxy API/cache, routing SPA, zasoby i health Nginx. | [Opis](../frontend/README.md) |
| [frontend/package-lock.json](../frontend/package-lock.json) | Dokładny graf wersji zależności dla npm ci. | [Opis](../frontend/README.md) |
| [frontend/package.json](../frontend/package.json) | Zależności pakietu i skrypty npm. | [Opis](../frontend/README.md) |
| [frontend/shared/roomSchedule.d.mts](../frontend/shared/roomSchedule.d.mts) | Typy eksportów modelu ESM dla TypeScript. | [Opis](../frontend/docs/KOD.md) |
| [frontend/shared/roomSchedule.mjs](../frontend/shared/roomSchedule.mjs) | Wspólny model runtime, walidacja i aktualizacja statusów. | [Opis](../frontend/docs/KOD.md) |
| [frontend/shared/roomSchedule.test.mjs](../frontend/shared/roomSchedule.test.mjs) | Trzy testy modelu, dat i granic czasu. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/App.tsx](../frontend/src/App.tsx) | Wybór zajęcia, komunikaty kopii i kompozycja widoku sali. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/api/roomApi.ts](../frontend/src/api/roomApi.ts) | Pobranie, walidacja planu i błędy API. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/api/settingsApi.ts](../frontend/src/api/settingsApi.ts) | Sprawdzenie hasła ustawień przez lokalny serwer. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/components/ApiSettings.tsx](../frontend/src/components/ApiSettings.tsx) | Kontekst endpointu, przycisk i dialog ustawień. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/components/ApiSettingsAccess.tsx](../frontend/src/components/ApiSettingsAccess.tsx) | Formularz hasła i montowanie edytora dopiero po poprawnej weryfikacji. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/components/CacheBackupControls.tsx](../frontend/src/components/CacheBackupControls.tsx) | Plik/token kopii, eksport i import JSON. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/components/ClockDisplay.tsx](../frontend/src/components/ClockDisplay.tsx) | Zegar i polska data widoku sali. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/components/CurrentLecturePanel.tsx](../frontend/src/components/CurrentLecturePanel.tsx) | Szczegóły zajęcia, status i pasek postępu. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/components/Dialog.tsx](../frontend/src/components/Dialog.tsx) | Natywny dialog/modal lub drawer i blokada przewijania. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/components/HeaderBar.tsx](../frontend/src/components/HeaderBar.tsx) | Sala, lokalizacja, zegar i przyciski widoku. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/components/Icon.tsx](../frontend/src/components/Icon.tsx) | Wewnętrzne ikony SVG widoku sali. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/components/LectureNavigator.tsx](../frontend/src/components/LectureNavigator.tsx) | Sąsiednie zajęcia, gesty, strzałki i powrót do domyślnego. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/components/PageState.tsx](../frontend/src/components/PageState.tsx) | Stany ładowania, błędu i braku konfiguracji. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/components/ScheduleItem.tsx](../frontend/src/components/ScheduleItem.tsx) | Pozycja listy harmonogramu. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/components/ScheduleSidebar.tsx](../frontend/src/components/ScheduleSidebar.tsx) | Lista dnia w dialogu. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/hooks/useLectureGestures.ts](../frontend/src/hooks/useLectureGestures.ts) | Przeglądanie zajęć gestami i kółkiem z uwzględnieniem scrolla. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/hooks/useNow.ts](../frontend/src/hooks/useNow.ts) | Zegar React aktualizowany co 15 s. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/hooks/useRoomSchedule.ts](../frontend/src/hooks/useRoomSchedule.ts) | Pobieranie, odświeżanie, błędy, anulowanie i statusy planu. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/index.css](../frontend/src/index.css) | Style układu, komponentów, responsywności i preferencji ruchu. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/lib/apiEndpoint.ts](../frontend/src/lib/apiEndpoint.ts) | Walidacja, zapis i podstawianie adresu endpointu. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/lib/schedule.ts](../frontend/src/lib/schedule.ts) | Formatowanie dat/godzin, czas trwania i odmiana liczebnika. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/lib/station.ts](../frontend/src/lib/station.ts) | Domyślna sala z buildu i ścieżka startowa. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/main.tsx](../frontend/src/main.tsx) | Montaż React, provider ustawień i publiczne trasy. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/pages/RoomPage.tsx](../frontend/src/pages/RoomPage.tsx) | Parametr sali, ładowanie/błąd i stan widoku. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/pages/StationPage.tsx](../frontend/src/pages/StationPage.tsx) | Przekierowanie do domyślnej sali lub brak przypisania. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/types/schedule.ts](../frontend/src/types/schedule.ts) | Typy metadanych, zajęć, planu i cache. | [Opis](../frontend/docs/KOD.md) |
| [frontend/src/vite-env.d.ts](../frontend/src/vite-env.d.ts) | Deklaracje typów środowiska Vite. | [Opis](../frontend/docs/KOD.md) |
| [frontend/tailwind.config.ts](../frontend/tailwind.config.ts) | Zakres skanowania klas i ustawienia Tailwind. | [Opis](../frontend/README.md) |
| [frontend/tsconfig.json](../frontend/tsconfig.json) | Zakres źródeł i opcje kompilacji TypeScript. | [Opis](../frontend/README.md) |
| [frontend/vite.config.ts](../frontend/vite.config.ts) | Build Vite, proxy developerskie i port interfejsu. | [Opis](../frontend/README.md) |

## Pliki i katalogi tworzone podczas pracy

| Lokalizacja | Kiedy powstaje i co zawiera |
| --- | --- |
| Główne `.env`, `backend/.env`, `frontend/.env` | Użytkownik kopiuje odpowiedni `.env.example`; lokalna konfiguracja i sekrety, ignorowane przez Git |
| `frontend/admin/.env.local` | Opcjonalne ustawienia developerskiego Vite panelu |
| `docker-compose.override.yml` | Opcjonalne lokalne nadpisania głównego Compose, poza repo |
| `backend/node_modules/`, `frontend/node_modules/`, `frontend/admin/node_modules/` | Zainstalowane zależności; nie edytuj ich zamiast źródeł |
| `backend/dist/` | Wynik kompilacji backendu |
| `frontend/dist/`, `frontend/admin/dist/` | Statyczne wyniki buildów |
| `frontend/cache-data/plans-<hash>.json` | Trwałe snapshoty używane przez Compose |
| `frontend/cache-data/*.tmp`, `*.corrupt-*` | Pozostałości przerwanego zapisu lub zachowany uszkodzony dokument; opis w CACHE.md |
| `frontend/.cache/` | Domyślny magazyn procesu cache uruchomionego developersko |
| Wolumen `*_postgres-data` | Pliki PostgreSQL zarządzane przez Docker; przenoszenie przez dump/restore |
| `.git/` | Lokalne metadane repozytorium, historia i konfiguracja Git |

Przykładowy folder cache na Windowsie i Linuksie oraz katalog `/data` wewnątrz kontenera opisuje [instrukcja frontendu](../frontend/README.md#lokalny-cache-json). W repo jest wyłącznie `.gitkeep`; pobranie Git nie przenosi faktycznych planów ani haseł.
