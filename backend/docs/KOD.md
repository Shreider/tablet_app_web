# Backend — pliki, typy i funkcje

[Uruchomienie](../README.md) · [API](API.md) · [Model bazy](../database/README.md)

Ścieżki w tym dokumencie są względem `backend/`. Nazwy w nawiasach kodowych odpowiadają symbolom źródłowym. Funkcje kontrolerów przyjmują Express `Request`, `Response`, `NextFunction`; repozytoria zwracają Promise rekordów lub ID, a walidatory rzucają błędy opisane w kontrakcie API. Funkcje prywatne opisano przy ich module. Anonimowe callbacki zapytań i JSX nie mają odrębnego publicznego kontraktu.

## Przepływ wywołania

Publiczny odczyt: `index.ts` → router → kontroler → serwis → `roomRepository` → `prisma` → PostgreSQL → mapper → JSON. Administracja: router → `requireAdminAuth` → kontroler walidujący → repozytorium administracyjne → `prismaAdmin` → mapper → JSON. Kontrolery administracyjne wywołują repozytoria bez dodatkowej warstwy serwisów.

### Start, środowisko i połączenia

| Plik | Funkcje i odpowiedzialność |
| --- | --- |
| [src/index.ts](../src/index.ts) | Tworzy Express, CORS i `express.json()`, montuje `/api`, kończy nieznane trasy 404. `errorHandler` loguje wyjątek i odpowiada ogólnym 500. `startServer` sprawdza `SELECT 1`, nasłuchuje na `0.0.0.0`, przy błędzie kończy proces z kodem 1. `shutdown` zamyka klientów/pule i kończy proces po SIGINT/SIGTERM. Uchwyt serwera HTTP nie jest zachowany do kontrolowanego drenażu połączeń. |
| [src/config/env.ts](../src/config/env.ts) | Eksport `env`: port, dwa URL bazy, token, strefa, lista originów. Rozdziela i przycina listę CORS. Nie ładuje pliku `.env`; wartości domyślne opisano w README. |
| [src/db/prisma.ts](../src/db/prisma.ts) | Tworzy `pg.Pool`, adaptery `PrismaPg`, `prisma` i `prismaAdmin`; identyczne URL współdzielą zasoby. `closePrismaClients` rozłącza klientów i zamyka pule, wewnętrzne `closeAdminPool` zapobiega podwójnemu zamykaniu współdzielonej puli. |
| [src/db/time.ts](../src/db/time.ts) | `getCurrentPartsFormatter(timeZone)` buforuje `Intl.DateTimeFormat` dla strefy, formatu en-CA i godzin h23. `getDateAndMinutesInTimezone(timeZone)` zwraca `{dateIso, minutes}` z aktualnego czasu systemowego. |
| [src/middleware/adminAuth.ts](../src/middleware/adminAuth.ts) | `safeEquals` sprawdza długość buforów i używa `timingSafeEqual`; `resolveAdminToken` wybiera Bearer lub `x-admin-token`; `verifyAdminToken` przycina i porównuje z konfiguracją; `requireAdminAuth` odpowiada 401 albo zapisuje `req.adminAuth` i wywołuje `next()`. |

### Routery — każdy plik

Każdy plik eksportuje obiekt routera Express; rejestracja tras jest wykonywana przy imporcie.

| Plik w `src/routes/` | Montowanie / trasy |
| --- | --- |
| `apiRoutes.ts` | Łączy `/health`, `/room`, `/rooms`, `/schedule`, `/admin` |
| `healthRoutes.ts` | GET `/` → `getApiHealth` |
| `roomRoutes.ts` | GET `/:roomId` → `getRoomById` |
| `roomsRoutes.ts` | GET `/` → `getRoomsList` |
| `scheduleRoutes.ts` | GET `/` → `getScheduleList` |
| `adminRoutes.ts` | `/auth` przed middleware, następnie autoryzacja i routery dashboard, conflicts, references, rooms, schedule-entries |
| `admin/adminAuthRoutes.ts` | POST `/login`, GET `/session`; własne sprawdzanie tokenu w kontrolerze |
| `admin/adminDashboardRoutes.ts` | GET `/` |
| `admin/adminConflictsRoutes.ts` | GET `/` |
| `admin/adminReferencesRoutes.ts` | GET `/`, GET `/:entity/:id/dependencies`, POST `/:entity`, PUT i DELETE `/:entity/:id` |
| `admin/adminRoomsRoutes.ts` | GET `/`, GET `/options`, POST `/`, GET/PUT/DELETE `/:id` |
| `admin/adminScheduleEntriesRoutes.ts` | GET `/options`, GET `/`, POST `/`, GET/PUT/DELETE `/:id` |

Stałe ścieżki `/options` muszą być rejestrowane przed `/:id`. Pełny kontrakt wszystkich tras: [API](API.md).

## Publiczny odczyt

| Plik | Funkcje |
| --- | --- |
| [src/controllers/healthController.ts](../src/controllers/healthController.ts) | `getApiHealth`: `SELECT 1`, metadane procesu i timestamp; wyjątek do `next`. |
| [src/controllers/roomController.ts](../src/controllers/roomController.ts) | `getRoomById`: no-store, przycięcie kodu, ścisła kontrola pojedynczego `date`, wywołanie serwisu, 404/400 albo 200. |
| [src/controllers/roomsController.ts](../src/controllers/roomsController.ts) | `getRoomsList`: odczyt listy przez serwis, 200; wyjątek do `next`. |
| [src/controllers/scheduleController.ts](../src/controllers/scheduleController.ts) | `getScheduleList`: rozpoznaje tekstowe `date` i `roomId`, wybiera pojedynczą salę lub cały dzień, obsługuje 404 i INVALID_DATE. |
| [src/services/roomsService.ts](../src/services/roomsService.ts) | `getRooms()`: pobiera sale, mapuje metadane, dodaje `generatedAt` i `total`. |
| [src/services/roomService.ts](../src/services/roomService.ts) | `getRoomSchedule(roomId, explicitDate=null)`: szuka sali, wybiera datę, odczytuje jej wpisy, mapuje i wybiera pierwszy current/upcoming; nieznana/pusta nazwa daje null. |
| [src/services/scheduleService.ts](../src/services/scheduleService.ts) | `isValidIsoDate`: regex i rzeczywiste części kalendarza UTC. `resolveDateFilter`: brak/puste → dzisiaj, błędna data → błąd INVALID_DATE. `getSchedule`: cały dzień, metadane i `{room, lecture}` dla każdego wpisu. `getScheduleForRoom`: walidacja daty i delegacja do serwisu sali. `isInvalidDateError`: strażnik kodu błędu. |
| [src/services/schedulePresentation.ts](../src/services/schedulePresentation.ts) | `toTimeString`: pierwsze 5 znaków godziny; prywatne `toMinutes`: HH:MM → minuty. `resolveStatus`: dzień i półotwarty przedział czasu → status. `mapRoomMetadata`: rekord → `RoomDetails`. `mapEntryToLectureEvent`: `lec-ID`, etykiety słowników, czas, status i opcjonalna notatka. |
| [src/repositories/roomRepository.ts](../src/repositories/roomRepository.ts) | `mapRoomRow`, `mapEntryRow`: Prisma → wewnętrzny rekord snake_case, daty przez helpery. `findAllRooms`: metadane z budynkiem/piętrem, sort kodu. `findRoomByCode`: przycięty kod, case-insensitive, null gdy brak. `findRoomScheduleForDate`: konkretne ID sali i data, relacje, sort początku. `findScheduleForDate`: wszystkie wpisy dnia z metadanymi sali, sort kodu i początku. |

Publiczne repozytorium nie filtruje `isActive` słowników. To zachowuje wcześniej zapisane zajęcia po dezaktywacji prowadzącego lub przedmiotu. W bazie unikalność kodu jest zwykła, a wyszukiwanie publiczne case-insensitive; unikaj kodów różniących się wyłącznie wielkością liter.

## Kontrolery administratora

### Uwierzytelnienie, dashboard, błędy

| Plik w `src/controllers/admin/` | Funkcje |
| --- | --- |
| `adminAuthController.ts` | `loginAdmin`: walidacja tokenu body do 256, porównanie, echo tokenu i roli albo 401. `validateAdminSession`: token nagłówka, stan authenticated albo 401. |
| `adminControllerUtils.ts` | `handleAdminError(error,res,next)`: VALIDATION_ERROR → 400, unikalność P2002/23505 → 409, FK P2003/23503 → 400, constraint P2004/23514 → 400, P2025 → 404, pozostałe do globalnego handlera. |
| `adminConflictsController.ts` | `getAdminConflicts`: pobiera pary, zwraca listę i jej długość. |
| `adminDashboardController.ts` | `getAdminDashboard`: bieżąca data, równolegle statystyki, 6 ostatnich sal, 10 ostatnich wpisów i konflikty; buduje ostrzeżenia oraz DTO. |

### Sale — `src/controllers/admin/adminRoomsController.ts`

- `parseRoomFormData(body)` przycina kod i nazwę, kontroluje długości, konwertuje `floorId` na dodatnią liczbę.
- `resolveDefaultBuildingId()` wybiera pierwszy aktywny budynek alfabetycznie; brak oznacza błąd walidacji.
- `validateFloor(floorId)` wymaga istniejącego, aktywnego piętra.
- `parseRoomSortBy(value)` sprawdza listę dozwolonych kolumn; domyślnie `roomCode`.
- `getAdminRoomsList` parsuje paginację/filtry/sortowanie, mapuje wiersze i wylicza `totalPages`.
- `getAdminRoomsOptions` łączy opcje sal i pięter. Repo pobiera też budynki do wewnętrznych opcji, lecz kontroler ich nie wystawia.
- `getAdminRoomDetails` sprawdza numeryczne ID, 404 gdy brak, zwraca salę i 12 ostatnich wpisów.
- `createAdminRoomRecord` waliduje formularz i piętro, dobiera budynek, tworzy i ponownie odczytuje rekord, odpowiada 201.
- `updateAdminRoomRecord` sprawdza istnienie, zachowuje budynek, aktualizuje pełny formularz i odpowiada 200.
- `deleteAdminRoomRecord` sprawdza zależne wpisy i flagę `cascade` z query/body, blokuje 409 albo usuwa wpisy i salę w osobnych operacjach.

### Wpisy — `src/controllers/admin/adminScheduleEntriesController.ts`

- `parseEntrySortBy` sprawdza whitelistę, domyślnie `eventDate`.
- `parseEntryPayload` konwertuje ID, datę i godziny, sprawdza start < koniec, wymagany opis, opcjonalną notatkę.
- `validateEntryRelations` równolegle sprawdza salę i aktywne słowniki; przedmiot wymaga też aktywnego kierunku.
- `getAdminScheduleEntriesList` waliduje paginację, filtry i zakres dat, pobiera listę, mapuje DTO.
- `getAdminScheduleEntryDetails` sprawdza ID i zwraca `{entry}` lub 404.
- `createAdminScheduleEntryRecord`, `updateAdminScheduleEntryRecord` walidują pełny formularz i relacje, zapisują, odczytują wynik; odpowiednio 201 i 200. Nie sprawdzają konfliktów jako blokady zapisu.
- `deleteAdminScheduleEntryRecord` sprawdza istnienie i usuwa wskazany wpis.
- `getAdminEntryFormOptions` łączy sale, prowadzących, grupy, typy i przedmioty w zestaw formularza.

### Słowniki — `src/controllers/admin/adminReferencesController.ts`

- `parseEntity` dopuszcza wyłącznie sześć typów słowników; `asInteger` konwertuje całkowite `sortOrder`.
- `parseReferencePayload` wybiera pola i limity według encji, normalizuje kod przedmiotu, domyślnie ustawia aktywność true.
- `validateReferenceRelations` dla przedmiotu sprawdza istnienie kierunku.
- `getAdminReferencesDataset` odczytuje i mapuje cały zestaw.
- `getAdminReferenceDependencies` sprawdza typ/ID/istnienie i zwraca liczniki zależności.
- `createAdminReferenceRecord`, `updateAdminReferenceRecord` walidują, zapisują i zwracają typ oraz ID.
- `deleteAdminReferenceRecord` zwraca 409 z zależnościami lub usuwa rekord.

## Repozytoria administratora

### `src/repositories/admin/adminRoomsRepository.ts`

`mapRoom` łączy pola sali, nazwy relacji i `_count` w `RoomWithEntriesCountRow`. `mapEntrySummary` mapuje wpis z metadanymi sali i słowników. `buildRoomWhere` buduje OR dla tekstu i filtr piętra; `resolveOrderBy` mapuje dopuszczone nazwy sortowania na Prisma, z dodatkowymi kluczami porządku.

| Funkcja | Wejście / działanie / wynik |
| --- | --- |
| `listAdminRooms(params)` | Count i strona równolegle; `{total,page,limit,rows}` |
| `findAdminRoomById(id)` | Sala z metadanymi i liczbą wpisów lub null |
| `findAdminRoomByCode(code)` | Case-insensitive, mały rekord ID/kod lub null; pomocnik obecny w module |
| `createAdminRoom(payload)`, `updateAdminRoom(id,payload)` | Zapis pól i relacji, zwrot ID |
| `countRoomScheduleEntries(id)` | Liczba wszystkich wpisów sali |
| `deleteRoomScheduleEntries(id)` | DeleteMany, liczba usuniętych |
| `deleteAdminRoom(id)` | Usunięcie rekordu, ID |
| `listRoomOptions()` | Wszystkie sale po kodzie, tylko ID/kod/nazwa |
| `listBuildingOptions()` | Aktywne budynki po nazwie |
| `listFloorOptions()` | Aktywne piętra po sortOrder i label |
| `listRoomFilterOptions()` | Łączy buildings i floors dla warstwy kontrolera |
| `listRecentScheduleEntriesForRoom(id,limit=8)` | Data i początek malejąco, pełne etykiety; kontroler podaje 12 |

### `src/repositories/admin/adminScheduleEntriesRepository.ts`

`toRow` mapuje pełne relacje do `ScheduleEntryWithRoomRow`. `buildWhere` łączy warunki AND oraz OR wyszukiwania; zakresy dat konwertuje na SQL DATE. `resolveOrderBy` mapuje kolumny i powiązane nazwy. Stała `includeScheduleRelations` utrzymuje wspólny zestaw joinów.

| Funkcja | Działanie |
| --- | --- |
| `listAdminScheduleEntries(params)` | Równoległe count/findMany z filtrami, offsetem i limitem |
| `findAdminScheduleEntryById(id)` | Pełny rekord albo null |
| `resolveEntryTitle(subjectId)` | Nazwa przedmiotu; awaryjnie „Zajęcia” |
| `createAdminScheduleEntry(payload)` | Pobiera tytuł, konwertuje datę/czas, tworzy, zwraca ID |
| `updateAdminScheduleEntry(id,payload)` | Ponownie ustala tytuł, nadpisuje pola, zwraca ID |
| `deleteAdminScheduleEntry(id)` | Usuwa, zwraca ID |
| `listLecturerOptions()` | Aktywni, fullName jako name, sort alfabetyczny |
| `listStudentGroupOptions()`, `listClassTypeOptions()` | Aktywne ID/name, sort name |
| `listSubjectOptions()` | Aktywne przedmioty z aktywnym kierunkiem, pełny rekord, sort code |

### `src/repositories/admin/adminReferenceRepository.ts`

Typy `AdminReferenceEntity`, `ReferencePayload`, osobne payloady encji i `ReferenceDataset` określają słowniki. `ReferenceDependency` to `{key,count,message}`. `BuildingPayload` i mapper budynku pozostają w module, ale bieżący typ encji/router nie oferuje CRUD budynków.

`toBuildingRow`, `toFloorRow`, `toLecturerRow`, `toStudentGroupRow`, `toClassTypeRow`, `toFieldOfStudyRow`, `toSubjectRow` tłumaczą Prisma camelCase na wewnętrzne snake_case; przedmiot dołącza nazwę kierunku.

- `listReferenceDataset()` odczytuje sześć tabel równolegle, również rekordy nieaktywne. Piętra sortuje po kolejności i etykiecie, pozostałe po nazwie lub kodzie.
- `createReferenceRecord(entity,payload)`, `updateReferenceRecord(entity,id,payload)`, `deleteReferenceRecord(entity,id)` wybierają model przez switch i zwracają ID.
- `listReferenceDependencies(entity,id)` liczy sale dla piętra, przedmioty dla kierunku, zajęcia dla pozostałych encji; zwraca tylko niezerowe zależności.
- `existsReferenceRecord(entity,id)` sprawdza ID właściwego modelu.

### Dashboard i konflikty

`src/repositories/admin/adminDashboardRepository.ts`: `fetchAdminDashboardStats(todayIso)` wykonuje równolegle pięć zapytań, w tym SQL self-join liczący pary nakładających się wpisów; `fetchRecentRooms(limit=5)` sortuje po updatedAt/id malejąco; `fetchRecentScheduleEntries(limit=8)` po createdAt/id malejąco i mapuje relacje. Kontroler ustawia limity 6 i 10.

`src/repositories/admin/adminConflictsRepository.ts`: `fetchConflictPairs()` pobiera wszystkie wpisy, grupuje po sali i dacie, sprawdza każdą parę w grupie. Wewnętrzne `mapEntry` tworzy `ConflictEntry`; `ConflictPair` łączy dwa wpisy. Koszt porównania jest kwadratowy w liczbie wpisów danej sali/dnia; brak paginacji i filtra dat konfliktów.

## Walidacja, daty i mapowanie

| Plik | Symbole i reguły |
| --- | --- |
| `src/utils/adminValidation.ts` | `asNonEmptyString`: trim, typ, długość; `asOptionalString`: brak/puste → null; `asPositiveInteger`: Number, integer > 0; `parsePagination`: page/limit/offset i max 100; `parseSortOrder`: asc/desc; `parseBooleanFlag`: boolean/true/false/1/0; `asIsoDate`: regex i kalendarz; `asTime`: HH:MM; `ensureStartBeforeEnd`: porównanie czasów w tym samym dniu. Błędy mają kod VALIDATION_ERROR. |
| `src/utils/prismaDate.ts` | `pad2`: dwie cyfry. `toDateOnly`: ISO dzień → UTC midnight Date; `formatDateOnly`: Date/część tekstu → dzień. `toTimeValue`: HH:MM → Date 1970-01-01 UTC; `formatTimeValue`: UTC części Date lub początek tekstu → HH:MM. |
| `src/utils/adminMappers.ts` | Prywatne `toTimeString` skraca czas. `mapRoomRecord`, `mapScheduleEntryRecord` tworzą główne DTO z datą/godziną; `mapRoomOption`, `mapReferenceOption` skracają opcje; `mapBuildingRecord`, `mapFloorRecord`, `mapLecturerRecord`, `mapStudentGroupRecord`, `mapClassTypeRecord`, `mapFieldOfStudyRecord`, `mapSubjectRecord` tłumaczą rekordy słownikowe na camelCase. |
| `src/types/errors.ts` | `createError(message,code)` dodaje kod do standardowego Error. |
| `src/types/express.d.ts` | Rozszerza Express Request o opcjonalne `adminAuth` z tokenem i authenticated. Nie jest kodem wykonywanym. |
| `src/types/domain.ts` | Typy rekordów, payloadów i paginacji opisane niżej; brak funkcji. |

`domain.ts` definiuje: `SortOrder`; `RoomRow`, `RoomWithEntriesCountRow`, `RoomOptionRow`; `ReferenceOptionRow`; `BuildingRow`, `FloorRow`, `LecturerRow`, `StudentGroupRow`, `ClassTypeRow`, `FieldOfStudyRow`, `SubjectRow`; `ScheduleEntryRow`, `ScheduleEntryWithRoomRow`, `ScheduleEntryWithRoomMetadataRow`; `DashboardStats`, `DashboardWarning`; `RoomPayload`, `ScheduleEntryPayload`, `PaginationResult<T>`. Rekordy mają snake_case zgodne z wewnętrzną warstwą mapowania; typy payloadów camelCase. Są to typy TypeScript, nie walidacja runtime.

## Seed, testy i pliki narzędziowe

`prisma/seed.ts`: `toDate`, `toTime` konwertują formaty seeda; `normalize` przycina tekst; `resolveFieldOfStudyName` zapewnia domyślną nazwę; `resolveSubjectCode` wybiera kod lub AUTO-MD5; `main` wykonuje transakcyjne odtworzenie słowników i zajęć na dzisiaj, raportuje liczby. Catch ustawia kod procesu, finally zamyka klienta/pulę.

`src/seed/seedRooms.ts`: `RoomSeedEntry`, `RoomSeed`, stała `roomSeeds`. Przechowuje pięć sal i opisane w [bazie](../database/README.md) dane demo. Nie jest odczytywany przez publiczne endpointy zamiast bazy.

`test/roomApi.integration.test.ts`: hook before wymaga `TEST_DATABASE_URL` z bazą `_test`, wdraża migracje, tworzy odizolowane rekordy, uruchamia skompilowane HTTP na wolnym porcie i czeka na health. Lokalny `createRoom` tworzy sale, `entry` buduje dane zajęć. Sześć testów kontroluje odczyt, przeszłość/przyszłość, pustą salę, brak sali i daty. Hook after zatrzymuje proces i usuwa własne rekordy. Nie jest to pokrycie całego API administratora.

| Plik | Rola |
| --- | --- |
| `package.json` | Zależności, ESM, skrypty wymienione w README |
| `package-lock.json` | Dokładny graf zależności dla `npm ci`; obecnie Prisma 7.6.0, Express 4.22.1, TypeScript 5.9.3, pg 8.20.0 |
| `tsconfig.json` | ES2022/NodeNext, strict, źródła `src`, wynik `dist`; test i seed poza podstawowym buildem, uruchamiane przez tsx |
| `Dockerfile` | Node 22 Alpine, OpenSSL, npm ci/generacja Prisma, build, migracja i start |
| `.dockerignore` | Wyklucza zależności/build, `.env` poza przykładem i pliki lokalne |
| `.env.example` | Ustawienia samodzielnego Compose |
| `docker-compose.yml` | API i PostgreSQL, prywatna sieć danych, healthchecki, wolumen |
| `prisma.config.ts` | dotenv, ścieżki Prisma, seed i URL datasource |
| `prisma/schema.prisma` | Dziewięć modeli i relacje; opis każdego pola w dokumentacji bazy |
| `prisma/migrations/migration_lock.toml` | PostgreSQL jako provider migracji |
| `prisma/migrations/*/migration.sql` | Każdy z czterech plików opisano osobno w dokumentacji bazy |
| `database/init/001_schema.sql`, `002_web_app_role.sql` | Komentarz o Prisma i inicjalizacja roli; szczegóły w bazie |
| `README.md`, `docs/API.md`, `docs/KOD.md`, `database/README.md` | Instalacja, kontrakt, referencja kodu i utrzymanie bazy |

Zmieniając funkcję, sprawdź jej wpływ na publiczny kontrakt, mappery i współdzielony model w frontendzie. Zmiana DTO nie aktualizuje automatycznie plików już zapisanych w cache; format wersji i walidacja importu wymagają świadomego utrzymania zgodności.
