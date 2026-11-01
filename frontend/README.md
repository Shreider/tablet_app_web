# Frontend

Ten katalog jest samodzielnym pakietem wdrożeniowym. Nie potrzebuje plików
z `backend/`. Zawiera widok sal (`src/`) i panel administratora (`admin/`).
Obraz frontendu buduje oba interfejsy i uruchamia je jako pliki statyczne na Nginx.
Compose uruchamia obok mały serwer Node.js zapisujący plany do pliku JSON.
Usługa nie potrzebuje własnej bazy danych ani dodatkowych zależności npm.

## Uruchomienie na serwerze frontendu

Wymagane: Docker z Buildx/BuildKit i Docker Compose.

```bash
cp .env.example .env
```

W `.env` ustaw `BACKEND_URL` na adres API osiągalny z tego serwera, np.
`http://192.168.1.20:3001` (bez `/api` i końcowego `/`). Ustaw też własny
`CACHE_ADMIN_TOKEN` do importu i eksportu zapisanych planów. Następnie:

```bash
docker compose up -d --build --wait
```

Cały katalog można skopiować na serwer bez katalogu `backend/` i bez plików
z korzenia repozytorium. Build instaluje zależności przez `npm ci` dla obu
interfejsów. Pliki `node_modules`, `dist`, `.env` i katalogi `.git` z hosta
są wykluczone przez `.dockerignore`.

- `/` — domyślna sala z `TABLET_ROOM_ID`;
- `/room/205` — konkretna sala;
- `/admin/` — panel administratora;
- `/api/room/:roomId` — plan z lokalnej usługi cache;
- `/api/cache/backup`, `/api/cache/import` — eksport i import kopii planów;
- pozostałe `/api/*` — żądania przekazywane do serwera backendu;
- `/healthz` — stan serwera frontendu, niezależny od dostępności API.

Port ustawia `FRONTEND_PORT` (domyślnie `5173`). `TABLET_ROOM_ID` jest argumentem
budowania; po jego zmianie przebuduj obraz. Zmiana `BACKEND_URL` wymaga
odtworzenia usług (`docker compose up -d --force-recreate frontend cache`).
Token administratora panelu i dane dostępowe do bazy są konfigurowane w backendzie.

## Lokalny cache JSON

Domyślna ścieżka danych działa tak: przeglądarka → Nginx → cache → główny backend.
Cache pobiera `/api/room/:roomId?date=YYYY-MM-DD`, sprawdza numer sali, datę i model
zajęć, a następnie atomowo zastępuje plik `/data/plans-<identyfikator-serwera>.json`.
Katalog `/data` jest podpięty do zwykłego folderu `cache-data/` obok tego README.
Dotyczy to zarówno samodzielnego Compose frontendu, jak i głównego Compose projektu.
Plik na komputerze to `frontend/cache-data/plans-<identyfikator-serwera>.json`;
pozostaje po odtworzeniu kontenerów. Frontend pozostaje statyczny;
generowanie JSON odbywa się w usłudze `cache`.

### Folder na Windowsie i Linuksie

Compose używa ścieżki względnej do katalogu danych, bez wpisywania ścieżek
konkretnego komputera. Przykłady dla projektu skopiowanego w podane miejsca:

| System | Plik na komputerze |
| --- | --- |
| Windows, projekt w `C:\tablet_app_web` | `C:\tablet_app_web\frontend\cache-data\plans-<identyfikator-serwera>.json` |
| Linux, projekt w `/home/user/tablet_app_web` | `/home/user/tablet_app_web/frontend/cache-data/plans-<identyfikator-serwera>.json` |
| Oba systemy, wewnątrz kontenera | `/data/plans-<identyfikator-serwera>.json` |

Na Windowsie wymagany jest Docker Desktop w trybie kontenerów Linux. Usługa
cache przy starcie przygotowuje prawa zapisu do podpiętego katalogu, a następnie
uruchamia API bez uprawnień roota. Na Linuksie używa UID i GID właściciela folderu;
dla katalogu należącego do roota (także typowego mapowania Docker Desktop) wybiera UID/GID 1000.
Gdy system udostępniający folder nie obsługuje zmiany właściciela, sprawdza faktyczny dostęp.

Katalog `cache-data/` zawiera w repozytorium wyłącznie `.gitkeep`; dane JSON są
pomijane przez Git i `.dockerignore`. Przy przenoszeniu działającej instalacji
na inny komputer skopiuj też `cache-data/`, jeśli plany mają być dostępne od startu
bez połączenia z głównym backendem. Zachowaj ten sam adres źródła `BACKEND_URL`.

### Przejście ze starszego wolumenu

Wcześniejsza wersja używała nazwanego wolumenu `schedule-cache`. Przed pierwszym
uruchomieniem nowej konfiguracji zatrzymaj dotychczasową usługę cache i skopiuj
z niej zawartość `/data` do `frontend/cache-data/` (także ze zatrzymanego kontenera).
Potem odtwórz usługę cache przez Compose. Dzięki temu kopia będzie działać także
bez głównego backendu. Samo przełączenie na pusty folder nie przenosi danych z wolumenu.
Stary wolumen może pozostać kopią zapasową.

### Ustawienia cache

Ustawienia `.env`:

| Zmienna | Znaczenie | Domyślnie |
| --- | --- | --- |
| `BACKEND_URL` | Adres głównego serwera, bez ścieżki | wymagany |
| `CACHE_ADMIN_TOKEN` | Token importu i eksportu kopii | wymagany w Compose frontendu |
| `CACHE_REFRESH_SECONDS` | Okres odświeżania planów | `60` |
| `CACHE_TIMEOUT_SECONDS` | Maksymalny czas oczekiwania na główny serwer | `5` |
| `CACHE_ROOM_IDS` | Numery sal rozdzielone przecinkami, pobierane od startu | `TABLET_ROOM_ID` |
| `APP_TIMEZONE` | Strefa czasowa daty planu i statusów zajęć | `Europe/Warsaw` |

Usługa zapamiętuje także sale odwiedzone w przeglądarce i odświeża ich dzisiejsze
plany w tle. Równoczesne odczyty tej samej sali współdzielą jedno pobranie.
Każda data jest przechowywana osobno; cache mieści do 500 planów i 8 MB JSON.
Gdy nie ma połączenia, poprawny lokalny plan nadal działa po odświeżeniu strony
i restarcie usług. Brak wcześniej zapisanych danych daje czytelny błąd dostępności.

Uszkodzona odpowiedź ani dane innej sali nie zastępują poprawnej kopii.
Odpowiedzi 401, 403 i 404 głównego serwera pozostają błędami; 404 usuwa zapisaną
salę, aby nie przywracać usuniętych danych. Przycisk **Ponów** wymusza sprawdzenie serwera.
Przy zmianie dnia można wyświetlić ostatni wcześniejszy plan z wyraźnym ostrzeżeniem
i właściwą datą. Jawne `?date=...` nigdy nie zastępuje wybranej daty inną.
Statusy „trwające”, „nadchodzące” i „zakończone” są przeliczane według czasu,
także podczas awarii. Odpowiedź ma dodatkowe pole `cache` z czasem pobrania,
flagami `stale`, `outdated`, `imported`, żądaną datą i strefą czasową.

### Import i eksport kopii

W oknie **API** wprowadź token kopii i wybierz **Pobierz kopię** albo wskaż plik
JSON i kliknij **Wczytaj kopię**. Token nie jest zapisywany w przeglądarce.
W głównym Compose projektu domyślnie używany jest `ADMIN_TOKEN`; można go zastąpić
osobnym `CACHE_ADMIN_TOKEN`. Obie operacje wymagają autoryzacji:

- `GET /api/cache/backup`, nagłówek `Authorization: Bearer <CACHE_ADMIN_TOKEN>`;
- `POST /api/cache/import`, ten sam nagłówek oraz `Content-Type: application/json`;
  treścią jest cały wyeksportowany plik.

Kopia ma format `room-tablet-cache`, wersję `1`, adres `source` i listę `entries`.
Import sprawdza cały plik przed zapisem. Scala kopię z lokalnymi planami,
zastępując tylko pasujące sale i daty. Zachowuje pierwotny czas pobrania;
zaimportowane dane są oznaczone do czasu potwierdzenia ich przez główny serwer.
Kopia musi mieć ten sam adres źródłowy. Zmiana adresu wybiera oddzielny plik cache.
Eksport zawiera wyłącznie zapisane plany i nie zastępuje kopii całej bazy PostgreSQL.
Jest gotowym plikiem do przechowania lub przekazania innemu systemowi; automatyczne
wysyłanie na główny serwer wymaga ustalenia jego endpointu importu.

## Zmiana endpointu podczas działania

W widoku sali kliknij **API**, wpisz endpoint i wybierz **Zapisz**. Przykłady:

```text
https://inny-serwer.example/api/room/{roomId}
https://inny-serwer.example/api/room/205
/api/room/{roomId}
```

`{roomId}` jest zastępowany numerem sali z adresu strony, np. `205` dla
`/room/205`. Można też podać pełny endpoint konkretnej sali lub endpoint
z parametrami zapytania. Musi zwracać JSON w opisanym poniżej formacie.

Zmiana działa natychmiast, bez odświeżania strony, restartu serwera ani budowania
obrazu. Poprzednie żądanie jest anulowane, a plan pobierany od nowa z wybranego
źródła. Ustawienie jest zapisywane w `localStorage` tej przeglądarki i zachowywane
po ponownym otwarciu strony. Przy zablokowanej pamięci przeglądarki działa do
przeładowania strony. Zmiany są synchronizowane między otwartymi kartami.

Przycisk **Przywróć domyślne** wraca do `/api/room/{roomId}`, lokalnego cache
i serwera wskazanego przez `BACKEND_URL`. Ustawienia są dostępne również podczas
ładowania i po błędzie połączenia, aby można było poprawić niedziałający adres.

Własny adres innego serwera jest wywoływany bezpośrednio z przeglądarki i omija
serwerowy cache. Aby zmienić źródło z zachowaniem lokalnej kopii, zmień `BACKEND_URL`.
Backend musi dopuszczać adres frontendu w `CORS_ORIGIN`. Przy stronie działającej
przez HTTPS własny endpoint również musi używać HTTPS. Domyślna ścieżka `/api`
nadal korzysta z lokalnej usługi cache.

Konfiguracja Nginx: `nginx/default.conf.template`. Przy starcie kontenera
oficjalny entrypoint Nginx podstawia `BACKEND_URL` do tej konfiguracji. Adres
jest sprawdzany przed uruchomieniem serwera: dozwolone są `http://` i `https://`,
nazwa lub IP serwera oraz opcjonalny port. Wartość nie może zawierać ścieżki.
Zmiana `BACKEND_URL` nie zmienia zbudowanych plików JavaScript. Widok sal
i panel administratora domyślnie wysyłają żądania do względnego `/api`.
Ścieżki sal i kopii trafiają do usługi `cache`; pozostałe API trafia na główny serwer.

## Pobieranie i wyświetlanie danych sali

Otwarcie `/room/205` powoduje wysłanie `GET /api/room/205` z nagłówkiem
`Accept: application/json`. Nginx przekazuje żądanie do lokalnego cache,
który w razie potrzeby pobiera plan z `BACKEND_URL`, np.
`http://192.168.1.20:3001/api/room/205?date=2026-11-01`.
W trybie deweloperskim analogiczne przekierowanie robi proxy Vite.

Frontend odczytuje JSON: `room` zawiera metadane sali, `date` datę planu,
`schedule` listę zajęć, a `currentLecture` i `nextLecture` wskazują zajęcia
trwające i nadchodzące. Wyświetla numer sali, budynek, piętro, przedmiot i jego
kod, datę, godziny, prowadzącego, grupę oraz opis.

Kod pobierania: `src/api/roomApi.ts`; obsługa odświeżania i błędów:
`src/hooks/useRoomSchedule.ts`. Dane są sprawdzane przed wyświetleniem.
Niepoprawny JSON lub brak wymaganych pól powoduje pokazanie komunikatu błędu.
Odczyt powtarza się co 60 sekund, gdy strona jest widoczna, oraz po powrocie
do karty lub odzyskaniu połączenia. Po nieudanym odświeżeniu ostatnio pobrany
plan pozostaje na ekranie z informacją o błędzie.

## Praca nad kodem bez Dockera

Wymagany Node.js 22.9 lub nowszy. Najpierw uruchom lokalny cache w tym katalogu,
z ustawionym `BACKEND_URL` i `CACHE_ADMIN_TOKEN` w `.env`:

```bash
npm run cache:dev
```

Dane zostaną zapisane w `.cache/` (katalog pomijany przez Git). Następnie widok sal:

```bash
npm ci
BACKEND_URL=http://192.168.1.20:3001 VITE_ROOM_ID=205 npm run dev
```

Panel, w drugim terminalu:

```bash
cd admin
npm ci
BACKEND_URL=http://192.168.1.20:3001 VITE_PUBLIC_APP_BASE_URL=http://localhost:5173 npm run dev
```

Tryb deweloperski: widok sal na `http://localhost:5173`, panel na
`http://localhost:5174/admin/`. Dwa serwery Vite służą wyłącznie do pracy nad
kodem; wdrożony frontend ma jeden serwer i jeden port.
`BACKEND_URL` w tym trybie ustawia proxy procesu Vite podczas jego startu;
nie trafia do kodu przeglądarki. `VITE_PROXY_TARGET` pozostaje obsługiwany jako
zastępcze ustawienie proxy. `VITE_API_BASE_URL` nie jest już używane.

Kompilacja:

```bash
npm run build
npm run build --prefix admin
```

Testy modelu, awarii serwera, restartu i importu (nie potrzebują PostgreSQL):

```bash
npm run test:cache
```

Docker kopiuje wyniki obu kompilacji do jednego katalogu serwera WWW,
z panelem w podkatalogu `/admin/` i obsługą bezpośrednich wejść na jego trasy.
