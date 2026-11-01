# API backendu

[Instalacja](../README.md) · [Kod](KOD.md) · [Baza](../database/README.md)

Przykładowy adres bazowy: `http://localhost:3001/api`. Wszystkie opisane ścieżki zawierają `/api`. Odpowiedzi aplikacji mają JSON; pośredniczący Nginx może zwrócić własną stronę błędu. Daty są ciągami `YYYY-MM-DD`, godziny `HH:MM`, znaczniki czasu ISO 8601. Identyfikatory administratora są dodatnimi liczbami, publiczny identyfikator sali jest kodem tekstowym.

## Autoryzacja

Publiczne odczyty nie wymagają tokenu. Operacje administratora wymagają `Authorization: Bearer <ADMIN_TOKEN>`; główny backend obsługuje też `x-admin-token`. Bearer ma pierwszeństwo, więc błędny Bearer nie jest zastępowany poprawnym drugim nagłówkiem. Porównanie sekretu jest odporne na proste porównania czasowe dla równych długości; tokeny są przycinane z białych znaków.

| Metoda i ścieżka | Wejście | Wynik |
| --- | --- | --- |
| `POST /api/admin/auth/login` | JSON `{"token":"..."}` | 200: `token`, `authenticated: true`, `role: "admin"` |
| `GET /api/admin/auth/session` | Nagłówek tokenu | 200: `authenticated: true`, `role: "admin"` |

Login przyjmuje niepusty token do 256 znaków. Błędny token daje 401 `INVALID_CREDENTIALS`, błąd formatu 400 `VALIDATION_ERROR`. Sesja i pozostałe trasy bez poprawnego nagłówka dają 401 `UNAUTHORIZED`. Login oddaje ten sam wspólny sekret; nie tworzy JWT, sesji w bazie ani czasu wygaśnięcia. Wylogowanie jest operacją przeglądarki. Token kopii JSON to osobny `CACHE_ADMIN_TOKEN` w [usłudze cache](../../frontend/docs/CACHE.md).

## Publiczne endpointy

| Metoda i ścieżka | Parametry | Odpowiedź 200 |
| --- | --- | --- |
| `GET /api/health` | Brak | `status: "ok"`, `service: "room-tablet-backend"`, `database: "ok"`, `timestamp` |
| `GET /api/rooms` | Brak obsługiwanych filtrów | `generatedAt`, `total`, `rooms: RoomDetails[]` |
| `GET /api/room/:roomId` | Kod sali; opcjonalny `date` | `RoomScheduleResponse` |
| `GET /api/schedule` | Opcjonalne `roomId` i `date` | Bez sali: `date`, `generatedAt`, `total`, `events`; z salą: `RoomScheduleResponse` |

Element `events` ma strukturę `{"room": RoomDetails, "lecture": LectureEvent}`. Zbiorczy plan jest sortowany po kodzie sali i początku zajęć. Lista sal po kodzie. `roomId` jest wyszukiwany bez rozróżniania wielkości liter po przycięciu. Odpowiedź zawiera zapisany w bazie kod; dla zgodności z rygorystycznym cache używaj dokładnej pisowni kodu z `GET /api/rooms`.

`/api/room/:roomId` sprawdza pojedynczą niepustą datę: pusty parametr, tablica po powtórzeniu, nierealna data lub zły format dają 400 `INVALID_DATE`. Nieznana sala daje 404 `ROOM_NOT_FOUND`; istniejąca bez zajęć 200 z `schedule: []`. Endpoint ustawia `Cache-Control: no-store`.

`/api/schedule` odczytuje parametry tylko wtedy, gdy są ciągami znaków. Puste i powtórzone `date` mogą zostać potraktowane jako brak filtra; to różnica względem `/room`. Błędna niepusta data tekstowa daje 400. Ten kontroler nie ustawia jawnego `Cache-Control: no-store`. Główne API ignoruje nieobsługiwane parametry; usługa cache sprawdza je ściślej.

### Publiczny model planu sali

Przykład: odpowiedź obliczona po zakończeniu zajęć w podanym dniu.

```json
{
  "room": { "roomId": "205", "name": "Sala 205", "building": "Budynek C", "floor": "2 piętro" },
  "date": "2026-11-01",
  "generatedAt": "2026-11-01T12:00:00.000Z",
  "currentLecture": null,
  "nextLecture": null,
  "schedule": [{
    "id": "lec-42",
    "title": "Bazy danych",
    "room": "205",
    "date": "2026-11-01",
    "lecturer": "Jan Kowalski",
    "group": "INF-2A",
    "type": "Laboratorium",
    "startTime": "08:00",
    "endTime": "09:30",
    "description": "Zapytania SQL",
    "fieldOfStudy": "Informatyka",
    "subjectCode": "INF-BD",
    "subject": "Bazy danych",
    "status": "finished",
    "isCurrent": false
  }]
}
```

`RoomDetails`: `roomId` to kod, `name` to nazwa wyświetlana, `building` i `floor` to etykiety powiązanych encji. `LectureEvent.id` to `lec-` + ID wpisu. `note` jest opcjonalne i pomijane przy SQL NULL. `fieldOfStudy`, `subjectCode`, `subject` pochodzą ze słowników. `title` jest osobnym polem wpisu, ustalanym przy zapisie z aktualnej nazwy przedmiotu; późniejsza zmiana nazwy przedmiotu nie przepisuje automatycznie starszych tytułów.

Statusy: przeszły dzień `finished`, przyszły `upcoming`. Dzisiaj przed początkiem `upcoming`, od początku włącznie do końca wyłącznie `current`, od końca `finished`. `isCurrent` odpowiada statusowi. `currentLecture` i `nextLecture` są pierwszymi pasującymi zajęciami w posortowanej liście albo `null`. Przy nakładających się wpisach może być więcej statusów `current`, ale wskaźnik jest jeden. Godziny oznaczają czas miejscowy `APP_TIMEZONE`, nie UTC.

## Sale administratora

Wszystkie poniższe trasy wymagają nagłówka tokenu.

| Metoda i ścieżka | Działanie i wynik |
| --- | --- |
| `GET /api/admin/rooms` | Lista stronicowana sal |
| `GET /api/admin/rooms/options` | `{rooms, floors}`; piętra aktywne |
| `GET /api/admin/rooms/:id` | `{room, relatedScheduleEntries}`; do 12 ostatnich wpisów wg daty i godziny malejąco |
| `POST /api/admin/rooms` | Pełne dane sali; 201 `{room}` |
| `PUT /api/admin/rooms/:id` | Pełne zastąpienie pól formularza; 200 `{room}` |
| `DELETE /api/admin/rooms/:id` | 200 `{deleted, id, cascade, relatedEntriesDeleted}` |

Filtry listy: `page` domyślnie 1, `limit` 10 (maksymalnie 100), `search`, `floorId`, `sortBy`, `sortOrder=asc|desc` (domyślnie asc). `search` przeszukuje kod, nazwę sali i etykietę piętra bez rozróżniania liter. Dozwolone `sortBy`: `id`, `roomCode` (domyślne), `displayName`, `floorLabel`, `createdAt`, `updatedAt`, `entriesCount`.

Format paginacji: `{page, limit, total, totalPages, rows}`. `totalPages` wynosi co najmniej 1, nawet dla pustej listy. Strona ponad zakresem może mieć pustą listę. Niepoprawne liczby i `limit > 100` powodują 400, nie automatyczne przycięcie.

Formularz POST/PUT:

```json
{ "roomCode": "205", "displayName": "Sala 205", "floorId": 1 }
```

Kod jest wymagany, do 32 znaków; nazwa do 120; piętro musi istnieć i być aktywne. Przy tworzeniu backend wybiera pierwszy aktywny budynek alfabetycznie; brak takiego budynku daje 400. Aktualizacja zachowuje istniejący budynek. `buildingId` nie jest polem obsługiwanego formularza. Brak sali: 404 `ROOM_NOT_FOUND`.

`AdminRoom`: `id`, `roomCode`, `displayName`, `buildingId`, `buildingName`, `floorId`, `floorLabel`, `createdAt`, `updatedAt`, `entriesCount`. Opcja sali: `id`, `roomCode`, `displayName`; opcja piętra: `id`, `label`.

Usuwanie sali z wpisami bez zgody: 409 `ROOM_HAS_RELATED_SCHEDULE_ENTRIES`, dodatkowe `relatedEntries`. `?cascade=true` lub `cascade: true` w JSON pozwala usunąć wpisy i salę. Nie jest to jedna transakcja: błąd drugiego kroku może pozostawić salę z już usuniętymi zajęciami. Przygotuj kopię przed świadomym usuwaniem danych.

## Wpisy harmonogramu

| Metoda i ścieżka | Działanie i wynik |
| --- | --- |
| `GET /api/admin/schedule-entries` | Lista stronicowana |
| `GET /api/admin/schedule-entries/options` | `{rooms, lecturers, studentGroups, classTypes, subjects}` |
| `GET /api/admin/schedule-entries/:id` | 200 `{entry}` |
| `POST /api/admin/schedule-entries` | 201 `{entry}` |
| `PUT /api/admin/schedule-entries/:id` | 200 `{entry}`, pełny formularz |
| `DELETE /api/admin/schedule-entries/:id` | 200 `{deleted: true, id}` |

Filtry: `page=1`, `limit=12` (maks. 100), `search`, `roomId`, `classTypeId`, `lecturerId`, `studentGroupId`, `subjectId`, `dateFrom`, `dateTo`, `sortBy=eventDate`, `sortOrder=asc`. Przedział dat jest obustronnie domknięty, `dateFrom <= dateTo`. Szukanie obejmuje tytuł, opis, prowadzącego, grupę, typ, kod/nazwę przedmiotu i kod sali. Sortowanie: `id`, `eventDate`, `startTime`, `endTime`, `roomCode`, `lecturerName`, `classTypeName`, `subjectCode`, `createdAt`. Odpowiedź paginacji jak dla sal.

POST/PUT (ID są przykładowe; pobierz rzeczywiste przez `/options`):

```json
{
  "roomId": 1,
  "eventDate": "2026-11-01",
  "lecturerId": 1,
  "studentGroupId": 1,
  "classTypeId": 1,
  "subjectId": 1,
  "startTime": "08:00",
  "endTime": "09:30",
  "description": "Zapytania SQL",
  "note": null
}
```

Wszystkie ID dodatnie. Sala musi istnieć, prowadzący/grupa/typ/przedmiot być aktywne; kierunek przedmiotu także aktywny. Data musi istnieć w kalendarzu, godziny w zakresie 00:00–23:59, początek ściśle przed końcem. Nie ma zajęć przechodzących przez północ. Opis po przycięciu jest wymagany, do 500 znaków; notatka opcjonalna do 500, pusta staje się NULL. Nie podaje się `title` ani kierunku — tytuł jest ustalany z przedmiotu, kierunek z jego relacji. Aktualizacja wymaga pełnych pól, nie jest PATCH.

`AdminScheduleEntry`: `id`, `roomId`, `roomCode`, `roomDisplayName`, `eventDate`, `title`, `lecturerId`, `lecturerName`, `studentGroupId`, `studentGroupName`, `classTypeId`, `classTypeName`, `subjectId`, `subjectCode`, `subjectName`, `fieldOfStudyId`, `fieldOfStudyName`, `startTime`, `endTime`, `description`, `note`, `createdAt`. Brak wpisu daje 404 `SCHEDULE_ENTRY_NOT_FOUND`.

Opcje prowadzącego/grupy/typu mają `id`, `name` i obejmują aktywne rekordy. Przedmiot ma pełny model opisany poniżej, wymaga aktywnego kierunku. Sale nie mają flagi `isActive`. Dezaktywacja słownika nie usuwa istniejących zajęć; publiczny odczyt ich nadal pokazuje.

**Nakładanie godzin nie blokuje tworzenia ani aktualizacji.** Konflikty są wykrywane i pokazywane osobno.

## Słowniki

| Metoda i ścieżka | Wynik |
| --- | --- |
| `GET /api/admin/references` | Cały zestaw: `floors`, `lecturers`, `studentGroups`, `classTypes`, `fieldsOfStudy`, `subjects` |
| `GET /api/admin/references/:entity/:id/dependencies` | `{entity, id, dependencies}` |
| `POST /api/admin/references/:entity` | 201 `{entity, id}` |
| `PUT /api/admin/references/:entity/:id` | 200 `{entity, id}` |
| `DELETE /api/admin/references/:entity/:id` | 200 `{entity, deleted: true, id}` |

Dozwolone `entity` i pełne dane POST/PUT:

| `entity` | Pola i ograniczenia |
| --- | --- |
| `floors` | `label`: niepuste do 80, `sortOrder`: liczba całkowita, `isActive` |
| `lecturers` | `fullName`: niepuste do 160, `isActive` |
| `student-groups` | `name`: niepuste do 160, `isActive` |
| `class-types` | `name`: niepuste do 120, `isActive` |
| `fields-of-study` | `name`: niepuste do 180, `isActive` |
| `subjects` | `code`: do 64, zamiana na wielkie litery; `name`: do 200; `fieldOfStudyId`: istniejący kierunek; `isActive` |

Brak `isActive` oznacza true, także przy PUT. Dane wyjściowe zawierają dodatkowo `id`, `createdAt`, `updatedAt`. Przedmiot ma `fieldOfStudyName`. Przy zapisie przedmiotu kontrolowana jest obecność kierunku; jego aktywność jest warunkiem dopiero użycia w formularzu zajęć.

Nie ma tras CRUD budynków ani skrzydeł. Budynek istnieje w bazie i jest potrzebny salom. Nieznany typ słownika: 400 `VALIDATION_ERROR`, brak rekordu: 404 `REFERENCE_NOT_FOUND`. Usuwanie używanego rekordu: 409 `REFERENCE_IN_USE` z `dependencies`. Element zależności ma `key`, `count`, `message`: piętro zależy od sal, kierunek od przedmiotów, pozostałe słowniki od wpisów harmonogramu. API nie usuwa takich powiązań kaskadowo.

## Dashboard i konflikty

`GET /api/admin/conflicts` zwraca `{conflicts: [{entryA, entryB}], total}`. Para dotyczy tej samej sali i daty, gdy `A.start < B.end && B.start < A.end`. Stykające się godziny nie są konfliktem. Raport obejmuje wszystkie daty, nie tylko dzisiaj. Liczba to liczba par, nie liczba unikalnych zajęć. Nie wykrywa kolizji prowadzącego lub grupy między różnymi salami. `ConflictEntry` ma pola wpisu administracyjnego poza polami kierunku i `createdAt`.

`GET /api/admin/dashboard` zwraca:

- `generatedAt`, `date` w strefie backendu;
- `stats`: `rooms`, `scheduleEntries`, `todayEntries`, `roomsWithoutEntries`, `overlappingEntries`;
- `conflicts`: pełne pary;
- `recentRooms`: do 6, pola `id`, `room_code`, `display_name`, `created_at`, `updated_at` — tu pozostaje zapis snake_case;
- `recentEntries`: do 10 ostatnio utworzonych, model `AdminScheduleEntry`;
- `warnings`: `{code, level, message}`, poziom `warning` lub `critical`.

`roomsWithoutEntries` oznacza sale bez jakichkolwiek wpisów, a nie bez dzisiejszego planu. `overlappingEntries` liczy pary wszystkich dat. Kod ostrzeżenia pustych sal to `ROOMS_WITHOUT_SCHEDULE`, konfliktu `OVERLAPPING_<idA>_<idB>`.

## Błędy i walidacja wspólna

Zwykle `{"error":"KOD","message":"Opis"}`; wybrane błędy mają dodatkowe `dependencies` lub `relatedEntries`.

| Status/kod | Znaczenie |
| --- | --- |
| 400 `VALIDATION_ERROR` | Formularz, liczba, sortowanie, data lub relacja nie spełnia reguł |
| 400 `INVALID_DATE`, `INVALID_ROOM_ID` | Walidacja publicznego odczytu |
| 400 `RELATION_VIOLATION` | Klucz obcy: Prisma P2003 lub PostgreSQL 23503 |
| 400 `CONSTRAINT_VIOLATION` | Ograniczenie danych: P2004/23514 |
| 401 | Token brakujący lub błędny |
| 404 | Brak encji lub trasy (`NOT_FOUND`) |
| 409 `DUPLICATE_VALUE` | Unikalność: P2002/23505 |
| 409 | Zależności blokują usunięcie |
| 500 | Ogólny nieobsłużony wyjątek; szczegóły w logach serwera |

P2025 jest mapowane na 404 `NOT_FOUND`. Teksty są przycinane. Parser liczb używa `Number`, więc akceptuje także część tekstowych reprezentacji liczb; klient powinien wysyłać właściwe liczby JSON. Flagi przyjmują boolean lub `true/false/1/0`; brak/pusty parametr używa wartości domyślnej. Powtórzonych parametrów admina nie traktuj jako obsługiwanego formatu. Nie ma kontraktu walidacji dowolnych dodatkowych pól: formularze odczytują tylko znane pola.

## Przykładowe wywołania

Bash; podstaw rzeczywisty sekret w zmiennej środowiska, nie w pliku repozytorium:

```bash
curl --fail http://localhost:3001/api/rooms
curl --fail 'http://localhost:3001/api/room/205?date=2026-11-01'
curl --fail -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3001/api/admin/schedule-entries/options
curl --fail -H "Authorization: Bearer $ADMIN_TOKEN" 'http://localhost:3001/api/admin/rooms?page=1&limit=10&sortBy=roomCode&sortOrder=asc'
```

PowerShell: `curl.exe --fail -H "Authorization: Bearer $env:ADMIN_TOKEN" http://localhost:3001/api/admin/rooms`. Do większych POST/PUT zapisz JSON w pliku i użyj `--data-binary @formularz.json -H 'Content-Type: application/json'`. Zapis zmienia rzeczywistą bazę; przykładowe ID muszą pochodzić z opcji tej instalacji.
