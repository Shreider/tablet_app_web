# Frontend — pliki, komponenty i funkcje

[Instalacja](../README.md) · [Obsługa ekranów](UZYTKOWANIE.md) · [Cache](CACHE.md)

Ścieżki są względem `frontend/`. Typy TypeScript są kontraktem kompilacji; plan sali dodatkowo podlega walidacji runtime we współdzielonym modelu. Panel administracyjny typuje odpowiedzi przez rzutowanie, bez analogicznej pełnej walidacji runtime. Każdy nazwany komponent/funkcja ma opis poniżej, łącznie z pomocnikami lokalnymi. Anonimowe callbacki JSX, efektów i mapowania opisano w zachowaniu modułu.

## Pakiety i uruchomienie

| Plik | Odpowiedzialność |
| --- | --- |
| `package.json` | Pakiet widoku sali i skrypty cache; React/Router/Vite/Tailwind/TypeScript |
| `package-lock.json` | Wersje dla npm ci: m.in. React 18.3.1, Router 7.13.2, Vite 5.4.21, TS 5.9.3 |
| `admin/package.json`, `admin/package-lock.json` | Osobne zależności i skrypty panelu, taki sam główny stos |
| `index.html` | Dokument widoku sali: root i moduł `src/main.tsx` |
| `admin/index.html` | Dokument panelu: root i `admin/src/main.tsx` |
| `src/main.tsx` | React StrictMode, provider ustawień API, BrowserRouter: `/`, `/room/:roomId`, fallback do `/` |
| `admin/src/main.tsx` | StrictMode, provider sesji, router z bazą `/admin/`, trasy logowania i chronionego layoutu |
| `vite.config.ts` | React i PostCSS z Tailwind/Autoprefixer; loadEnv; proxy sal/kopii do CACHE_URL i reszty API do BACKEND_URL/VITE_PROXY_TARGET; port 5173 |
| `admin/vite.config.ts` | Analogiczny build panelu, base `/admin/`, port 5174, wszystkie `/api` do głównego backendu |
| `tsconfig.json`, `admin/tsconfig.json` | ES2020, DOM, ESNext/Bundler, strict, noEmit, nieużywane symbole jako błędy, JSX react-jsx; include src |
| `src/vite-env.d.ts`, `admin/src/vite-env.d.ts` | Typy środowiska Vite; brak kodu runtime |
| `tailwind.config.ts` | Skanowanie HTML/src, bez dodatkowych pluginów |
| `admin/tailwind.config.ts` | Skanowanie panelu, rozszerzone kolory, cienie, promienie i animacje fade/pop |

React StrictMode może w dev powtórzyć konfigurację efektu i cleanup; hooki muszą sprzątać timery i nasłuchy. Nie oznacza to dwóch produkcyjnych procesów cache.

### Style

`src/index.css` importuje warstwy Tailwind, definiuje kolory i typografię, układ room-shell/header/workspace/footer, kartę zajęć, statusy, postęp, nawigację, listę harmonogramu, dialogi, ustawienia API, kopie, komunikaty i stany strony. Breakpointy szerokości 900/600 px i niski ekran 650 px dostosowują układ. Animacje spin/appear mają reguły preferencji ruchu. Nie ma dołączonych własnych plików fontów; lista font-family przechodzi do fontów systemowych, gdy wskazane fonty nie są dostępne.

`admin/src/index.css` definiuje warstwy Tailwind i odpowiedniki panelu: sidebar, topbar, główna treść, statystyki, tabele, filtry, formularze, dialog/drawer, karty konfliktów, badge i logowanie. Reguły 1179/900/600 px zmieniają nawigację i tabele; w wąskim widoku etykiety komórek wykorzystują `data-label`. `prefers-reduced-motion` ogranicza animacje. Ikony są kodem SVG, bez zewnętrznych obrazów.

## Model i typy planu

`src/types/schedule.ts`: `LectureStatus` = current/upcoming/finished. `LectureEvent` opisuje wpis publiczny, `RoomDetails` metadane, `RoomScheduleResponse` dzień, wskaźniki, listę i opcjonalne metadane cache. Pełne pola i reguły w [API](../../backend/docs/API.md#publiczny-model-planu-sali) i [cache](CACHE.md#format-dokumentu).

`shared/roomSchedule.mjs` jest zwykłym ESM uruchamianym w przeglądarce, cache i testach:

| Symbol | Wejście, wynik i reguła |
| --- | --- |
| `object(value)` | Prywatna kontrola obiektu różnego od null/tablicy |
| `stringFields(value,fields)` | Prywatna kontrola, że wskazane pola są tekstami |
| `validDate(value)` | Regex ISO dnia, parsowanie i round-trip eliminujący nieistniejące daty |
| `validRoomId(value)` | Kod 1–128 znaków bez brzegowych spacji, kontroli, slash/backslash i `.`/`..` |
| `localTime(now=new Date(),timeZone='Europe/Warsaw')` | Intl formatToParts → `{date,minutes}`, h23 |
| `minutes(time)` | Prywatne HH:MM → minuty |
| `liveSchedule(data,now,timeZone)` | Kopiuje plan, przelicza statusy i wskaźniki; cache.outdated pozostaje true lub staje się true dla starszego dnia |
| `RoomSchedule.fromJSON(value,expected={})` | Statyczna fabryka: walidacja, opcjonalna zgodność roomId/date, unikalne ID, poprawne czasy, maks. 2000 zajęć, projekcja znanych pól, sort początku/ID; zwraca instancję |
| Lokalny `invalid()` | Rzuca wspólny błąd formatu z fabryki |
| `RoomSchedule.toJSON(now,timeZone)` | Zwraca aktualną reprezentację przez liveSchedule; nie odtwarza bezkrytycznie zapisanych statusów |

`shared/roomSchedule.d.mts` deklaruje typy dla tych eksportów i metod klasy; implementacja jest w `.mjs`. To pozwala TS importować wspólny model bez kompilowania Node/cache. Podstawowe tsc frontendów nie jest osobnym sprawdzeniem typów całego kodu `.mjs`.

## Widok sali

### API i adresy

`src/lib/apiEndpoint.ts`:

- `defaultApiEndpoint` = `/api/room/{roomId}`, `apiEndpointStorageKey` = `room_tablet_api_endpoint`.
- `validateApiEndpoint(input)` przycina, wymaga http(s) lub ścieżki rozpoczynającej się pojedynczym `/`, dopuszcza wyłącznie placeholder `{roomId}`, sprawdza URL bez loginu/hasła/fragmentu i blokuje HTTP ze strony HTTPS; zwraca oryginalny poprawny szablon.
- `loadApiEndpoint()` czyta localStorage i waliduje, przy błędzie wraca do domyślnego.
- `saveApiEndpoint(endpoint)` usuwa klucz dla domyślnego lub zapisuje nadpisanie, toleruje brak dostępu do storage.
- `resolveApiEndpoint(endpoint,roomId)` podmienia wszystkie wystąpienia znacznika na encodeURIComponent kodu.

`src/api/roomApi.ts`:

- `ApiError` i jego `constructor(message,status)` zachowują status HTTP dla decyzji widoku.
- `isObject` kontroluje obiekt pomocniczy.
- `parseJsonResponse(response,roomId)` próbuje odczytać JSON, błędny HTTP zamienia na ApiError z message; sukces sprawdza przez RoomSchedule, osobno waliduje metadane cache i strefę. Niepoprawny model daje ApiError 502.
- `fetchRoomSchedule(roomId,signal,endpoint=defaultApiEndpoint,forceRefresh=false)` składa URL względem originu przeglądarki, dodaje refresh=1 wyłącznie przy dokładnym domyślnym szablonie, wysyła GET Accept JSON/cache no-store i deleguje parserowi.

`src/api/settingsApi.ts`: `unlockApiSettings(password,signal)` wysyła JSON do lokalnego `/api/cache/settings/unlock` z no-store. Odczytuje message dla błędu HTTP, a przy sukcesie wymaga literalnego authenticated=true. Nie zapisuje hasła ani odpowiedzi jako sesji.

### Hooki

`src/hooks/useRoomSchedule.ts` — `useRoomSchedule(roomId,endpoint)` zwraca `{data,loading,error,notFound,refresh}`. Efekt zależy od sali, adresu i licznika odświeżeń. Lokalny `load` blokuje równoległy odczyt, tworzy osobny AbortController i timeout 15 s, zapisuje wynik lub błąd. `cancelRequest` łączy anulowanie efektu z żądaniem; `refreshWhenVisible` odpytuje tylko widoczną kartę. Efekt ustawia timer 60 s i nasłuchy online/visibilitychange/room-tablet-cache-updated, cleanup wszystko usuwa i przerywa żądanie. Dane 401/403/404 są usuwane, przy innych błędach mogą zostać w RAM. Zwracany plan przechodzi przez liveSchedule z zegarem useNow. `refresh` zwiększa licznik i powoduje próbę wymuszoną.

`src/hooks/useNow.ts` — `useNow()` tworzy Date, co 15 s ustawia nowy czas i sprząta timer po odmontowaniu. Nie jest zegarem zsynchronizowanym z serwerem.

`src/hooks/useLectureGestures.ts` — `useLectureGestures(options)` przyjmuje activeId, disabled, dostępność sąsiadów i onNavigate; zwraca viewportRef i `navigate`. Funkcja navigate sprawdza blokady/granice, wywołuje callback i blokuje pozostały fragment gestu. Zmiana activeId zeruje scrollTop.

Pomocniki hooka: `canScroll(direction)` sprawdza krawędź treści, `canNavigate` sąsiada. `onWheel` ignoruje zoom/horyzontalne gesty, normalizuje jednostki, najpierw przewija opis, następnie akumuluje próg 80 i rozdziela gesty przerwą 180 ms oraz blokadą 450 ms. `onTouchStart` zapamiętuje punkt i krawędzie; `onTouchMove` zapobiega przewinięciu, gdy gest może przełączyć kartę; `onTouchEnd` wymaga pionowego ruchu co najmniej 60 px i przewagi nad poziomym; `onTouchCancel` resetuje. Nasłuchy wheel/touchmove są niepasywne i sprzątane. Handler `navigate` jest zwracanym callbackiem hooka.

### Strony i komponenty — każdy plik

| Plik | Komponenty i zachowanie |
| --- | --- |
| `src/pages/StationPage.tsx` | `StationPage`: Navigate do defaultRoomPath albo PageState braku przypisania |
| `src/lib/station.ts` | `defaultRoomId` z VITE_ROOM_ID, `defaultRoomPath` koduje go do URL; bez funkcji |
| `src/pages/RoomPage.tsx` | `RoomPage`: parametry routera i ustawienia endpointu, klucz sali/adresu wymusza nowy stan. `RoomView`: hook danych, document.title i cleanup, loading/notFound/error albo App. |
| `src/App.tsx` | `App({data,error,onRefresh})`: wybór zajęcia i stanu harmonogramu; domyślny current/next/ostatni; komunikat zależny od cache/error, stopka i połączenie komponentów. |
| `src/components/HeaderBar.tsx` | `HeaderBar`: kod, budynek/piętro, zegar, ustawienia i otwarcie harmonogramu z liczbą pozycji |
| `src/components/ClockDisplay.tsx` | `ClockDisplay`: useNow, polski czas/data w stałej Europe/Warsaw |
| `src/components/CurrentLecturePanel.tsx` | `CurrentLecturePanel({lecture})`: pusty stan lub dane zajęcia; czas trwania i elapsed ograniczony do 0–duration, postęp tylko isCurrent; nie wyświetla note |
| `src/components/LectureNavigator.tsx` | `LectureNavigator`: indeks i sąsiedzi, callback `onNavigate` wybiera pozycję index+direction, integracja gestów, strzałki lewo/prawo, przyciski i powrót do domyślnego; disabled podczas harmonogramu |
| `src/components/ScheduleSidebar.tsx` | `ScheduleSidebar`: Dialog drawer, uporządkowana lista ScheduleItem albo komunikat pustki |
| `src/components/ScheduleItem.tsx` | `ScheduleItem`: przycisk godziny, tytułu, prowadzącego, grupy, stan wybrany i „Teraz”; wywołuje onClick z całym zajęciem |
| `src/components/PageState.tsx` | `PageState`: loading/status albo alert, opcjonalne ponowienie i zawsze dostępny przycisk API |
| `src/components/Icon.tsx` | `Icon({name,size=20})`: wewnętrzne paths SVG dla calendar/close/refresh/left/right/chevron/info, aria-hidden |
| `src/components/Dialog.tsx` | `Dialog`: natywny showModal/close, ref, tytuł, opcjonalny drawer, overflow body, cancel/close/tło, dzieci montowane wyłącznie przy open |

### Ustawienia i kopie

`src/components/ApiSettingsAccess.tsx`: `ApiSettingsAccess({children})` początkowo renderuje wyłącznie formularz hasła. Po udanym lokalnym sprawdzeniu montuje dzieci z edytorem i kopiami. Lokalny `unlock` blokuje powtórny submit, tworzy AbortController i timeout 15 s, wywołuje unlockApiSettings, czyści hasło i ustawia unlocked. Błąd pokazuje komunikat bez odsłaniania dzieci. Efekt ustawia fokus przez requestAnimationFrame, a cleanup anuluje żądanie i usuwa referencję; spóźniona odpowiedź po zamknięciu nie odblokuje nowego okna. Cały komponent jest odmontowywany przez Dialog po zamknięciu, więc każde otwarcie wymaga hasła.

`src/components/ApiSettings.tsx`: `useApiSettings` zwraca kontekst albo błąd braku providera. `ApiSettingsButton` otwiera okno i wystawia aria-expanded. `ApiSettingsProvider` przechowuje endpoint/open/draft/error, montuje ApiSettingsAccess, a dopiero po odblokowaniu formularz i CacheBackupControls. Lokalne `syncSettings` reaguje na storage i reset całego storage, `applyEndpoint` zapisuje i zamyka, `openSettings` odtwarza bieżącą wartość i czyści błąd. Submit waliduje; przycisk domyślny pomija własny draft. Provider opakowuje także strony błędów.

`src/components/CacheBackupControls.tsx`: `CacheBackupControls` utrzymuje token, plik, busy, message/error. Lokalny `transfer(importing)` sprawdza 8 MiB, wysyła Bearer z timeoutem 15 s, dla importu surowy tekst JSON i event odświeżenia, dla eksportu Blob/object URL, tymczasowy link pobierania i revoke. Błędy HTTP odczytuje z message; sieć i timeout mają własny komunikat. Token znika przy odmontowaniu dzieci Dialog, nie jest utrwalany.

`src/lib/schedule.ts`: `timeZone` to stała Europe/Warsaw; `toMinutes` konwertuje HH:MM; `durationOf` oblicza różnicę (ma korektę przez północ, choć model odrzuca takie zajęcia); `formatDay` formatuje polski dzień z południa UTC, `formatTime` godziny/minuty, `lessonCount` odmianę liczby zajęć. Nie każdy eksport musi być obecnie użyty w UI.

## Serwer cache

### Pliki i API programistyczne

| Plik | Rola |
| --- | --- |
| `cache/Dockerfile` | Node 22 Alpine; przygotowanie /data, kopia cache/*.mjs i modelu; CACHE_DIR=/data, PORT=3002, start entrypoint |
| `cache/entrypoint.mjs` | Top-level await: mkdir, ustalenie UID/GID folderu, ograniczone chown, setgroups/setgid/setuid, sprawdzenie dostępu, start serwera |
| `cache/server.mjs` | HTTP, źródło, odświeżanie, autoryzacja, konfiguracja środowiska |
| `cache/store.mjs` | FileCache: walidacja i pojedynczy atomowo wymieniany dokument |
| `cache-data/.gitkeep` | Zachowanie pustego folderu w Git; właściwe dane są ignorowane |

`createCacheServer(options)` tworzy aplikację, lecz samo nie wywołuje listen. Zwraca `{server,cache,refreshKnownRooms}`. Opcje: wymagane `backendUrl` i `directory`, `adminToken`, `settingsPassword` (fallback do adminToken), `timeZone` (Warsaw), `refreshMs` (60000), `timeoutMs` (5000), `maxEntries` (500), `roomIds` (lista), `background` (false wyłącza tło), `now` (funkcja zegara, domyślnie Date). Testy korzystają z portu 0 i kontrolowanego now. Zakresy liczb są sprawdzane w wrapperze środowiska, nie przez pełny walidator każdej opcji programistycznej.

### `cache/server.mjs` — funkcje

| Symbol | Działanie |
| --- | --- |
| `HttpError.constructor(status,message,code='CACHE_ERROR')` | Błąd z kodem HTTP i maszynowym |
| `normalizeSource(value)` | URL.origin HTTP(S), bez ścieżki, loginu, query i fragmentu |
| `integer(value,fallback,min,max)` | Liczba całkowita z zakresem albo błąd konfiguracji |
| `readLimited(stream,limit)` | Zlicza bajty async iterable, zbiera Buffer, dekoduje UTF-8, ponad limit 413 |
| `createCacheServer(options)` | Normalizacja źródła i strefy, otwarcie FileCache, mapy attempts/pending, serwer HTTP, tło i cleanup |
| Lokalny `unlockSettings(request,response)` | Sprawdzenie konfiguracji, blokady prób, Content-Type i ograniczonego JSON-u; lokalny `digest` oblicza SHA-256 obu haseł, timingSafeEqual, 401/429 lub authenticated=true |
| Lokalny `refresh(roomId,date)` | Deduplikacja Promise, zapamiętanie próby, fetch/timeout, odrzucanie 4xx, walidacja i zapis, zapis błędu zamiast utraty snapshotu |
| `getRoom(roomId,date,explicitDate,force)` | Ocena świeżości, oczekiwanie na pobranie, dobór konkretnego lub wcześniejszego planu, aktualne statusy i cache metadata |
| `authenticate(request)` | Wymaga skonfigurowanego tokenu i Bearer, timingSafeEqual; 503/401 |
| `json(response,status,value,headers={})` | Content-Type JSON UTF-8, no-store, nosniff, dodatkowe nagłówki i serializacja |
| `refreshKnownRooms()` | Dzisiejszy plan skonfigurowanych i zapisanych sal; maks. 4 pracowników, kontrola ostatniej próby |
| `tick()` | Cykl tła, log błędów i setTimeout po jego zakończeniu, unref |
| `startCacheFromEnvironment()` | Parsuje środowisko i zakresy, tworzy aplikację, listen 0.0.0.0, SIGINT/SIGTERM zamyka serwer, awaryjny exit po 10 s |

Guard na końcu pliku uruchamia wrapper tylko przy bezpośrednim wywołaniu modułu. Import w testach nie otwiera automatycznie portu. Handler HTTP obsługuje pięć tras opisanych w CACHE.md, dekoduje kod, waliduje query i autoryzację, mapuje błędy oraz nie ujawnia pełnego błędu dysku klientowi. `server.requestTimeout` wynosi 15000.

### `cache/store.mjs` — klasa FileCache

| Symbol/metoda | Wejście i zachowanie |
| --- | --- |
| `keyOf(roomId,date)` | JSON.stringify pary, bez kolizji separatora |
| `MAX_BACKUP_BYTES` | 8 × 1024 × 1024 |
| `constructor(directory,source,maxEntries=500)` | Ścieżka z SHA-256, Map entries, Promise queue |
| `validateBackup(backup)` | Format/v1/source, limit liczby, pary i czasy, model payloadu; zwraca nową Map bez zmiany aktywnej |
| `document(entries=this.entries)` | Dokument z exportedAt i listą wpisów |
| `open()` | mkdir, odczyt, parse/walidacja; ENOENT pusto, uszkodzenie → zachowanie .corrupt, I/O → wyjątek |
| `update(change)` | Kolejka: clone → change → sort/przycięcie → limit bajtów → zapis tmp+flush → rename → publikacja Map |
| `get(roomId,date)` | Dokładna para albo undefined |
| `latest(roomId,date)` | Najpóźniejsza data <= żądanej dla sali |
| `put(entry)` | update ustawiające jedną parę |
| `forgetRoom(roomId)` | update usuwające wszystkie daty sali |
| `import(backup)` | Walidacja całości i merge, imported=true, liczba wpisów kopii |

Szczegóły błędów, ograniczeń i trwałości: [CACHE.md](CACHE.md). Kolejka nie jest blokadą wieloprocesową.

## Panel administratora

### Sesja i nawigacja

`admin/src/admin/auth/AdminAuthContext.tsx`: `AdminAuthProvider` odczytuje sessionStorage, przechowuje status loading/authenticated/unauthenticated i token. Wewnętrzne `restoreSession` sprawdza token przez API, przy błędzie usuwa go. Callback `login` przycina, sprawdza niepustą wartość, wywołuje adminLogin i utrwala zwrócony token; `logout` usuwa go i ustawia unauthenticated. `useAdminAuth` wymaga providera. Dostęp do sessionStorage nie jest opakowany tolerancją błędu jak localStorage ustawień sali.

`admin/src/admin/config/adminNavigation.ts`: listy `adminEntityMetaList`, `adminEntityMetaByKey`, `adminEntityKeysBySection`, `adminNavGroups`, `adminNavItems`, `sectionLabelMap` opisują menu, sekcje i etykiety. `resolveEntityForSection(section,rawEntity)` dopuszcza encję w danej sekcji albo null; `resolvePageTitle(pathname)` znajduje tytuł z fallbackiem; `resolveNavContext(pathname)` zwraca grupę/pozycję albo null. Typy AdminEntitySection, AdminEntityMeta, AdminNavItem i AdminNavGroup opisują konfigurację.

| Plik w `admin/src/admin/components/` | Symbole i zachowanie |
| --- | --- |
| `AdminProtectedRoute.tsx` | `AdminProtectedRoute`: loading, przekierowanie na login z from albo Outlet; kontrola frontendowa uzupełnia middleware API |
| `AdminLayout.tsx` | `navIcon` dobiera SVG; `AdminNavigation` buduje grupy NavLink i wylogowanie; `AdminClock` odświeża Date co sekundę w lokalnej strefie; `AdminLayout` składa sidebar/topbar/Outlet/footer i mobilny dialog, tytuł dokumentu, link publiczny. Lokalny `closeOnDesktop` zamyka menu po przejściu do min-width 1180. |
| `AdminDialog.tsx` | `AdminDialog`: natywny dialog z nagłówkiem, dziećmi i opcjonalną stopką; busy blokuje zamknięcie Escape/tłem/przyciskiem, overflow i aria; dzieci montowane przy open |
| `AdminIcon.tsx` | `AdminIcon({name,size=20})` i AdminIconName: wewnętrzne SVG, aria-hidden |
| `AdminUi.tsx` | Wspólne komponenty opisane niżej |

`AdminUi.tsx`: `AdminPanel` sekcja z tytułem/podtytułem/akcjami; `LoadingBlock`, `ErrorBlock`, `EmptyBlock` stany dostępności; `PaginationControls` granice stron; `StatusBadge` ton ok/warn/critical/info; `ConfirmModal` używa AdminDialog, busy, destrukcyjnego potwierdzenia i opcjonalnego ukrycia anulowania; `openNativePicker` próbuje input.showPicker i toleruje brak obsługi; `formatDateTime`, `formatDate` formatują w lokalnej strefie, zachowują nieparsowalny tekst, pusta data daje `-`.

### Klient API — `admin/src/admin/api/adminApi.ts`

`AdminApiError.constructor(message,status,payload)` zachowuje błąd i surowy payload. `buildAuthHeaders(token)` tworzy Bearer albo pusty obiekt. `parseJsonResponse<T>` próbuje JSON, błędny status zamienia na AdminApiError z message, sukces rzutuje na T. `toQueryString(params)` pomija null/undefined/puste, koduje URLSearchParams. `normalizeSchedulePayload` przycina note i zamienia puste na null.

Wszystkie funkcje używają stałego `/api`, niezależnie od ustawień endpointu widoku sali:

| Funkcja | Żądanie |
| --- | --- |
| `adminLogin(token)` | POST /admin/auth/login, JSON token |
| `validateAdminSession(token)` | GET /admin/auth/session |
| `fetchAdminDashboard(token)` | GET /admin/dashboard |
| `fetchAdminRooms(token,params)` | GET /admin/rooms z filtrami |
| `fetchAdminRoomsOptions(token)` | GET /admin/rooms/options |
| `fetchAdminRoomDetails(token,id)` | GET /admin/rooms/:id |
| `createAdminRoom(token,payload)` | POST /admin/rooms |
| `updateAdminRoom(token,id,payload)` | PUT /admin/rooms/:id |
| `deleteAdminRoom(token,id,cascade=false)` | DELETE, opcjonalne ?cascade=true |
| `fetchAdminScheduleEntries(token,params)` | GET /admin/schedule-entries |
| `fetchAdminScheduleOptions(token)` | GET /admin/schedule-entries/options |
| `fetchAdminScheduleEntryDetails(token,id)` | GET /admin/schedule-entries/:id |
| `createAdminScheduleEntry(token,payload)` | POST z normalizacją note |
| `updateAdminScheduleEntry(token,id,payload)` | PUT z normalizacją note |
| `deleteAdminScheduleEntry(token,id)` | DELETE wpisu |
| `fetchAdminConflicts(token)` | GET /admin/conflicts |
| `fetchAdminReferencesDataset(token)` | GET /admin/references |
| `fetchAdminReferenceDependencies(token,entity,id)` | GET /admin/references/:entity/:id/dependencies |
| `createAdminReference(token,entity,payload)` | POST /admin/references/:entity |
| `updateAdminReference(token,entity,id,payload)` | PUT /admin/references/:entity/:id |
| `deleteAdminReference(token,entity,id)` | DELETE /admin/references/:entity/:id |

Typy lokalne: `FetchAdminRoomsParams`, `RoomFormPayload`, `FetchScheduleEntriesParams`, `ScheduleEntryFormPayload`. Funkcje klienta admin nie mają wbudowanego timeoutu/AbortSignal, retry ani ogólnego automatycznego wylogowania po każdym 401. Niektóre strony mają AbortController jedynie jako strażnik zapisu stanu po odmontowaniu; nie jest przekazywany do fetch.

### Strony panelu — funkcje lokalne i stan

| Plik w `admin/src/admin/pages/` | Funkcje |
| --- | --- |
| `AdminLoginPage.tsx` | `AdminLoginPage`: token/submitting/error, document.title, powrót do from albo dashboard. `onSubmit`: preventDefault, login, błąd i finally busy=false. |
| `AdminDashboardPage.tsx` | `AdminDashboardPage`: stan i reloadNonce, efekt z `loadDashboard` pobiera dane i respektuje odmontowanie. `DashboardStatCard` tworzy statystykę/link z tonem, `QuickLinkCard` skrót z ikoną. Render statystyk, ostrzeżeń, konfliktów i ostatnich zajęć. |
| `AdminRoomsPage.tsx` | `AdminRoomsPage`: filtry, strona, opcje i stany dialogów. `loadRooms` pobiera po 10, `loadOptions` pobiera sale/piętra i przy błędzie zeruje opcje. `openCreateForm`, `openEditForm` inicjują formularz; `validateRoomForm` wymaga kodu/nazwy/piętra; `submitForm` zapisuje i przeładowuje listę/opcje. `openDetails` pobiera metadane/wpisy. `onRequestDeleteRoom` zeruje zgodę; `confirmDeleteRoom` usuwa, a przy 409 informuje i ustawia cascade do kolejnego potwierdzenia. |
| `AdminScheduleEntriesPage.tsx` | `AdminScheduleEntriesPage`: lista po 12 i wszystkie filtry. `loadEntries`, `loadOptions` pobierają listę i słowniki; błąd opcji daje puste listy. `openCreateForm` ustawia pierwsze ID, pustą datę/czasy; `openEditForm` kopiuje wpis. `validateEntryForm` sprawdza wybory, datę, start<koniec i opis. `submitForm` tworzy/aktualizuje, odświeża dane. `openDetails` pobiera szczegóły; `confirmDeleteEntry` usuwa i przeładowuje listę. |
| `AdminCatalogPage.tsx` | `getDatasetCount` liczy wskazaną sekcję. `AdminCatalogPage` sprawdza entity/section i przekierowuje nieznaną; `loadDataset` pobiera pełny zestaw. `openCreateForm` ustawia puste pola i pierwszy kierunek, `openEditForm` kopiuje rekord. `resolvePayloadForEntity` wybiera pola, `validateReferenceForm` sprawdza wymagania encji. `submitForm` tworzy/aktualizuje i odczytuje zestaw; `requestDelete` otwiera potwierdzenie i sprawdza zależności; `confirmDelete` blokuje używany rekord lub usuwa. |
| `AdminConflictsPage.tsx` | `validateForm` sprawdza formularz wpisu; `AdminConflictsPage` zarządza konfliktami, opcjami i edycją. Dwie lokalne funkcje `load` w efektach odczytują pary oraz opcje. `openEdit` kopiuje wskazany wpis, `closeEdit` resetuje, `handleFormChange` zmienia pole, `submitEdit` waliduje/zapisuje i zwiększa reloadNonce. `ConflictPairCard` pokazuje salę/datę i dwa `ConflictEntryCard`, które prezentują dane i przycisk edycji. |

Strony mają lokalne loading/error/busy, komunikaty po zapisie i cleanup timerów komunikatów (około 2,8–3 s). Filtry sal i wpisów stosują tekst po Enter/blur; zmiany selektów resetują stronę do 1. Nie ma jednego globalnego store danych administratora ani cache zapisów offline.

### Typy panelu — `admin/src/admin/types.ts`

`AdminRoom`, `AdminScheduleEntry`, `AdminRoomOption`, `AdminReferenceOption`, `AdminFloorOption`; `AdminSubject`, `AdminFloor`, `AdminLecturer`, `AdminStudentGroup`, `AdminClassType`, `AdminFieldOfStudy`; `PaginatedResponse<T>`; `AdminDashboardStats`, `AdminDashboardWarning`, `AdminDashboardResponse`; `AdminRoomsOptionsResponse`, `AdminScheduleOptionsResponse`, `AdminReferencesDatasetResponse`; `AdminReferenceEntity`, `AdminReferenceDependency`; `AdminConflictEntry`, `AdminConflictPair`, `AdminConflictsResponse`. Opis pól odpowiada [API backendu](../../backend/docs/API.md). `recentRooms` dashboardu zachowuje snake_case, choć większość modeli panelu ma camelCase.

## Docker i serwowanie — pozostałe pliki

| Plik | Rola |
| --- | --- |
| `Dockerfile` | Etap Node 22: npm ci dwóch pakietów, TABLET_ROOM_ID → VITE_ROOM_ID, oba buildy. Etap nginx:stable-alpine: pliki, szablon i walidator; NGINX_ENVSUBST_FILTER=BACKEND_URL chroni własne zmienne Nginx przed podstawieniem |
| `docker-entrypoint.d/19-validate-backend-url.sh` | Shell `set -eu`, wymaga http(s), host/IP (także zapis IPv6 w nawiasach) i opcjonalny port; blokuje ścieżkę i znaki wstrzyknięcia konfiguracji. Wykonywany przed standardowym envsubst oficjalnego obrazu |
| `nginx/default.conf.template` | Port 80, root, resolver Dockera, backend/cache URL, health, trzy grupy proxy, limit importu, SPA dwóch aplikacji, zasoby i index no-cache |
| `docker-compose.yml` | Usługi frontend/cache, build, port, wymagane zmienne, zależność od zdrowego cache, bind mount, healthchecki |
| `.dockerignore` | Wyklucza node_modules/dist/.env poza przykładami, .git, .cache i cache-data |
| `.env.example` | Samodzielny backend URL, token, port, strefa, okresy i domyślna sala |
| `README.md`, `docs/UZYTKOWANIE.md`, `docs/CACHE.md`, `docs/KOD.md` | Wdrożenie, obsługa, trwałość/API kopii i referencja źródeł |

## Testy i pomocniki

`shared/roomSchedule.test.mjs`: `fixture` tworzy plan testowy; trzy testy sprawdzają granice czasu, północ/starszy dzień, odrzucanie sal/dni/czasów/duplikatów.

`cache/test/cache.test.mjs`: `fixture` buduje plan, `close` zamyka HTTP i połączenia; `setup` tworzy tymczasowy katalog i testowe upstream/cache z kontrolowanym zegarem. Lokalny `start` uruchamia cache na porcie 0; zwracane pomocniki `setMode`, `advance`, `request`, `restart`, `stopUpstream`, `backup`, `import` sterują awariami, czasem i transferem. Cleanup usuwa katalog i serwery. Trzy testy hasła kontrolują prawidłowe/błędne logowanie bez upstream, niezależność od tokenu kopii, fallback, brak konfiguracji, formaty body i limit prób. Dodatkowe testy entrypointu uruchamiają rzeczywisty proces potomny, sprawdzają obniżenie UID, zapis i dostęp właściciela katalogu. Zakres i warunki pominięcia: [weryfikacja](../../docs/WERYFIKACJA.md).

Nie ma testów E2E kliknięć przeglądarki ani kompletnego pokrycia panelu admina. Zmiany modelu/API trzeba sprawdzać po obu stronach i względem istniejących plików backupu.
