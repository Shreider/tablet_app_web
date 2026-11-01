# Lokalny cache JSON

[Instalacja](../README.md) · [Obsługa](UZYTKOWANIE.md) · [Kod](KOD.md)

Cache to osobna usługa Node.js przy frontendzie. Zapisuje poprawne odpowiedzi planu sali do pliku na komputerze i pozwala je odczytać po restarcie, gdy główny backend nie odpowiada. Nie jest pełną repliką PostgreSQL ani kolejką zmian administracyjnych.

## Gdzie jest plik

Przy Compose: `frontend/cache-data/plans-<hash>.json` w pełnym projekcie albo `cache-data/plans-<hash>.json` w samodzielnie skopiowanym katalogu frontendu. W kontenerze: `/data/plans-<hash>.json`. Oba Compose używają ścieżek względnych; nie ma wpisanej ścieżki `/home/atur` ani dysku Windows.

`hash = sha256(source).slice(0,20)`, zapis szesnastkowy. `source` jest znormalizowanym `URL.origin` z BACKEND_URL: schemat + host + ewentualny niedomyślny port. Zmiana IP, nazwy hosta, schematu lub portu może wybrać inne źródło i plik, nawet jeśli pod spodem działa ta sama baza. Normalizacja może usunąć domyślny port i zmienić wielkość liter nazwy hosta. Nginx dodatkowo wymaga konfiguracji bez końcowego `/`.

Plik powstaje przy pierwszym skutecznym zapisie; sam start pustego cache tworzy katalog, nie musi tworzyć JSON-u. Eksport pustej pamięci daje dokument z pustą listą. Nie należy wpisywać nazwy konkretnego pliku na stałe do konfiguracji aplikacji.

W trybie `npm run cache:dev` domyślny katalog to `./.cache`; `CACHE_DIR=./cache-data` pozwala wskazać folder Compose. Ścieżki względne procesu Node zależą od katalogu uruchomienia. Jednocześnie tylko **jeden proces cache** powinien zapisywać dany plik: kolejka serializuje operacje wewnątrz procesu, nie ma blokady między procesami ani replikami.

### Uprawnienia

`cache/entrypoint.mjs` działa w obrazie jako początkowy proces root, przygotowuje katalog i obniża uprawnienia przed startem HTTP. Dla katalogu należącego do innego UID niż 0 używa jego UID/GID. Dla katalogu root wybiera 1000/1000. Zmienia właściciela katalogu oraz regularnych plików pasujących do `plans-*.json` i ich rozszerzeń; nie wykonuje dowolnego rekurencyjnego chown. Następnie usuwa grupy dodatkowe, ustawia GID i UID.

Niektóre współdzielone foldery Windows nie obsługują chown. Dla EPERM/EACCES/ENOTSUP entrypoint przechodzi do kontroli rzeczywistego R/W/X po obniżeniu uprawnień. Brak dostępu zatrzymuje usługę z komunikatem. Nowe pliki są tworzone z trybem 0600 tam, gdzie system honoruje prawa POSIX. Windows/Docker Desktop stosuje własne mapowanie praw. Testy automatyczne startu root/UID wymagają systemu z odpowiednimi uprawnieniami; natywny Windows nie był tutaj testowany.

## Co uruchamia pobieranie

1. Pierwsze żądanie `/api/room/:roomId` wybiera dzisiejszą datę w APP_TIMEZONE, a jawne `?date=...` konkretny dzień.
2. Cache sprawdza zapis i czas ostatniej próby. Domyślnie nie ponawia pobrania częściej niż co 60 s, chyba że klient wymusi `refresh=1`.
3. Pobiera `GET <source>/api/room/<zakodowany-kod>?date=YYYY-MM-DD`, z Accept application/json, bez przekazywania tokenów użytkownika, z limitem czasu 5 s i bez śledzenia przekierowań.
4. Wymaga JSON-u, maksymalnie 2 MiB odpowiedzi, poprawnego modelu tej samej sali i daty. Dopiero potem zapisuje plik i publikuje nowy stan w pamięci.
5. Zwraca plan ze statusami przeliczonymi dla aktualnego czasu oraz metadanymi `cache`.

Równoległe odczyty tej samej sali/dnia współdzielą Promise pobrania. Różne plany mogą być pobierane równolegle; zapis pliku przechodzi przez wspólną kolejkę. Ograniczenie czterech pracowników dotyczy **odświeżania w tle**, nie wszystkich żądań HTTP.

Po rozpoczęciu nasłuchu i po kolejnych okresach cache odświeża dzisiejsze plany sal z CACHE_ROOM_IDS oraz sal obecnych w zapisach. Nie pobiera automatycznie całej listy sal, całego roku ani wszystkich historycznych dat. Nieudane odwiedzenie nie dodaje sali do trwałego zestawu znanych sal. TIMER jest planowany po zakończeniu poprzedniego cyklu, więc czas między początkami cykli może być dłuższy niż ustawiony okres.

Ostatnia nieudana próba też jest zapamiętana w RAM, co ogranicza ponawianie podczas awarii. Te mapy prób nie są zapisywane na dysku. Po restarcie odczyt świeżego snapshotu może od razu zwrócić dane; tło sprawdzi go, gdy upłynie okres. Po zatrzymaniu serwera timer jest czyszczony; nie ma pracy w tle, gdy proces jest wyłączony.

## Awaria i wybór kopii

| Wynik upstream | Działanie |
| --- | --- |
| 2xx i poprawny plan | Zapis, fetchedAt = czas pobrania, imported = false |
| Sieć, timeout, 5xx, 408, 429, przekierowanie, zły content type/JSON/model lub błąd zapisu przy pobraniu | Ostatni poprawny snapshot ze stale; gdy brak — 503 |
| 4xx poza 408/429 | Autorytatywny błąd przekazany klientowi bez przywracania planu |
| 404 | Dodatkowo usuwa wszystkie zapisane daty tej sali |

Bez jawnej daty, gdy brak dzisiejszej, można zwrócić najnowszy wcześniejszy plan tej sali, nigdy przyszły. Nie ma maksymalnego wieku takiej kopii. Zwracane `date` pozostaje rzeczywistą datą snapshotu; `requestedDate` wskazuje żądany dzień, a `outdated=true` wymusza ostrzeżenie. Przy `?date=...` cache używa wyłącznie tej daty.

Zapis jest ograniczony domyślnie do 500 snapshotów sala/dzień i 8 MiB całego serializowanego dokumentu. Przy przekroczeniu liczby pozostawia zapisy o najnowszych fetchedAt, a nie maksymalnie 500 sal. Przekroczenie limitu bajtów odrzuca operację, nie przycina treści zajęć. Zmniejszenie konfiguracji poniżej liczby wpisów istniejącego dokumentu może spowodować uznanie go przy starcie za niezgodny i odłożenie jako `.corrupt-*`.

Cache ma osobną kontrolę czasu oraz frontend własną: karta pobiera co 60 s, gdy jest widoczna, a statusy przelicza co 15 s. Otwarcie starej kopii nie zamraża statusu „trwające”. Różnice zegarów hostów mogą wpływać na statusy i walidację; fetchedAt z przyszłości o ponad 60 s jest odrzucane podczas importu/otwarcia.

## Format dokumentu

Poniższy przykład jest kompletnym dokumentem z pustym planem; wartości źródła i daty muszą pasować do instalacji:

```json
{
  "format": "room-tablet-cache",
  "version": 1,
  "source": "http://backend:3001",
  "exportedAt": "2026-11-01T10:00:00.000Z",
  "entries": [{
    "roomId": "205",
    "date": "2026-11-01",
    "fetchedAt": "2026-11-01T09:59:00.000Z",
    "imported": false,
    "payload": {
      "room": { "roomId": "205", "name": "Sala 205", "building": "Budynek C", "floor": "2 piętro" },
      "date": "2026-11-01",
      "generatedAt": "2026-11-01T09:59:00.000Z",
      "schedule": [],
      "currentLecture": null,
      "nextLecture": null
    }
  }]
}
```

`format`, `version`, `source` i lista entries są sprawdzane. Para `(roomId,date)` musi być unikalna; fetchedAt parsowalny i nie za daleko w przyszłości. `exportedAt` jest metadanym generowanym przy serializacji, ale nie jest kluczem wyboru ani obowiązkowo walidowaną datą wejścia. `imported` jest uznawane za true tylko dla literalnego true; sam import ustawi true dla wszystkich wczytanych wpisów.

Payload przechodzi przez `RoomSchedule.fromJSON`: poprawna data, kod sali (1–128 znaków, bez obramowujących spacji, znaków sterujących, `/`, backslash, `.` i `..`), metadane tekstowe i parsowalny generatedAt. Do 2000 zajęć, unikalne niepuste ID, ta sama sala/data, HH:MM ze start < koniec. Wymagane teksty zajęcia: id, title, room, date, lecturer, group, type, startTime, endTime, description. Opcjonalne: note, fieldOfStudy, subjectCode, subject — jeśli obecne, muszą być tekstami; `null` dla note w tym modelu publicznym nie jest poprawne. Pełny model: [API backendu](../../backend/docs/API.md#publiczny-model-planu-sali).

Model projektuje wyłącznie znane pola, sortuje po początku i ID, ignoruje zapisane currentLecture/nextLecture/status/isCurrent i przelicza je ponownie. Dane logowania nie są dodawane do backupu przez aplikację. Sam JSON zawiera informacje o planach, m.in. prowadzących i grupach.

### Metadane odpowiedzi HTTP

Odczyt planu przez cache dodaje:

```json
{
  "cache": {
    "fetchedAt": "2026-11-01T09:59:00.000Z",
    "timeZone": "Europe/Warsaw",
    "requestedDate": "2026-11-01",
    "stale": true,
    "outdated": false,
    "imported": false
  }
}
```

`stale` oznacza ostatni błąd, import albo przekroczony okres od fetchedAt. Nie jest dowodem, że treść faktycznie się zmieniła. `outdated` oznacza inny dzień niż żądany; frontend dodatkowo zaznacza dzień starszy od bieżącego. `imported` trwa do skutecznego pobrania od źródła. `generatedAt` jest czasem wygenerowania payloadu upstream, `fetchedAt` czasem pobrania lokalnego, `exportedAt` czasem zbudowania dokumentu kopii.

## Zapis i uruchomienie po awarii

`FileCache.update` klonuje Map, wykonuje zmianę, sortuje/przycina, sprawdza bajty, zapisuje `plans-....json.<UUID>.tmp` z 0600 i flush, następnie rename na docelowy plik. Dopiero sukces aktualizuje Map w RAM. Operacje są szeregowane przez Promise queue; po błędzie kolejka nadal przyjmuje następne operacje. Tymczasowy plik jest sprzątany przy obsłużonym błędzie.

To chroni przed częściowym dokumentem przy normalnej wymianie pliku; repo nie implementuje gwarancji odporności na każdą awarię sprzętu/systemu plików, fsync katalogu ani blokady między procesami. Przerwanie procesu w środku zapisu może pozostawić `.tmp`; nie jest ono odczytywane jako aktywny JSON.

`open` tworzy katalog i odczytuje dokument. ENOENT oznacza pusty cache. Błąd parsowania lub walidacji zachowuje plik jako `.corrupt-<timestamp>` i uruchamia pusty cache. Błędy wejścia/wyjścia z kodem, np. EACCES, zatrzymują start. Nie edytuj pliku podczas działania procesu: pamięć nie jest przeładowywana automatycznie, kolejny zapis może nadpisać ręczną zmianę. Korzystaj z importu albo zatrzymaj usługę przed odtwarzaniem plików.

## Hasło przed edycją ustawień API

Przycisk API montuje najpierw formularz hasła. `POST /api/cache/settings/unlock` przyjmuje `Content-Type: application/json` i body `{"password":"..."}`. Poprawne hasło daje 200 `{"authenticated":true}`, błędne 401. Brak konfiguracji daje 503; zły format JSON/puste hasło 400; zły Content-Type 415; body ponad 4096 bajtów 413. Pole password ma limit 1024 jednostek długości tekstu JavaScript, a limit bajtów dotyczy całego JSON-u. Odpowiedź nie oddaje sekretu i ma no-store.

Hasło jest odczytywane z `API_SETTINGS_PASSWORD`, a przy braku/pustej wartości z `CACHE_ADMIN_TOKEN`. W głównym Compose ten drugi domyślnie dziedziczy ADMIN_TOKEN. Pięć błędnych prób w oknie minuty blokuje sprawdzanie na 30 s; kolejne żądanie w blokadzie daje 429 SETTINGS_LOCKED i Retry-After. Licznik dotyczy instancji cache, nie osobnego użytkownika/IP, jest w RAM i resetuje się po restarcie. Poprawne sprawdzenie zeruje licznik. Nie wymaga połączenia z głównym backendem.

Weryfikacja porównuje skróty SHA-256 przez timingSafeEqual; konfiguracja nadal przekazuje hasło jako sekret środowiska, nie zapisuje go do pliku planów. Nie powstaje serwerowa sesja ani token odblokowania. UI przechowuje sam stan odblokowania do zamknięcia dialogu i wtedy go usuwa. Hasło nie jest wbudowane w JS ani zapisywane przez aplikację w localStorage/sessionStorage.

Ochrona dotyczy interfejsu konfiguracji. Endpoint sali jest nadal publiczny, adres endpointu pozostaje lokalnym ustawieniem przeglądarki, a import/eksport nadal wymaga osobnego Bearer tokenu. Dostęp do narzędzi developerskich lub plików profilu przeglądarki pozwala zmieniać jej lokalne ustawienia; nie jest to zarządzanie uprawnieniami kont systemowych.

## Eksport i import

W oknie **API** najpierw odblokuj edycję hasłem. Następnie wpisz token kopii, kliknij **Pobierz kopię** albo wybierz JSON i **Wczytaj kopię**. Token jest tylko w stanie komponentu, znika po zamknięciu okna; nie jest zapisywany do localStorage/sessionStorage. Limit klienta to 8 MiB, timeout 15 s. Import wysyła surowy JSON, nie multipart/form-data. Po sukcesie emituje `room-tablet-cache-updated` i wywołuje odczyt planu.

| Metoda/ścieżka | Nagłówki | Wynik |
| --- | --- | --- |
| GET `/api/cache/backup` | `Authorization: Bearer <CACHE_ADMIN_TOKEN>` | 200 cały dokument, Content-Disposition attachment |
| POST `/api/cache/import` | Ten sam Bearer, Content-Type application/json | 200 `{"imported": liczba}` |
| GET `/healthz` bezpośrednio w cache | Brak | 200 `{"status":"ok","snapshots": liczba}` |
| GET `/api/room/:roomId` | Brak tokenu | Plan; date opcjonalne, refresh=1 wymusza pobranie |

Nginx `/healthz` dotyczy samego Nginx; aby sprawdzić cache, użyj jego healthchecku albo `docker compose exec -T cache node -e "fetch('http://127.0.0.1:3002/healthz').then(r=>r.json()).then(console.log)"`.

Bash, z katalogu zawierającego wyeksportowaną kopię:

```bash
curl --fail -H "Authorization: Bearer $CACHE_ADMIN_TOKEN" -o kopia.json http://localhost:5173/api/cache/backup
curl --fail -H "Authorization: Bearer $CACHE_ADMIN_TOKEN" -H 'Content-Type: application/json' --data-binary @kopia.json http://localhost:5173/api/cache/import
```

PowerShell: `curl.exe` i `$env:CACHE_ADMIN_TOKEN`. Sekret należy ustawić samodzielnie w środowisku powłoki; `.env` Compose nie eksportuje go do terminala.

Import najpierw sprawdza cały dokument, potem scala po sali/dacie. Nadpisuje pasujące plany **niezależnie od tego, czy importowany fetchedAt jest starszy**. Pozostałe pozostają, z zastrzeżeniem globalnego limitu wpisów. Zachowuje pierwotny fetchedAt, ustawia imported true, zeruje mapę prób odświeżenia. Przy działającym API kolejny odczyt lub tło może od razu zastąpić import świeżym planem. W odpowiedzi imported jest liczba poprawnie wczytanych wpisów, nie gwarantowana końcowa liczba wszystkich snapshotów po przycięciu.

Źródło musi być dokładnie zgodne z aktualnym znormalizowanym originem. Plik przeniesiony do frontendu wskazującego inny URL nie będzie zaakceptowany. Import nie ma opcji wymuszenia ani automatycznego przepisania source.

### Błędy cache

JSON aplikacji: `error`, `message`. Domyślny kod `CACHE_ERROR`; odrzucenie przez API ma `UPSTREAM_REJECTED`, awaria `UPSTREAM_UNAVAILABLE`.

| Status | Powód |
| --- | --- |
| 400 | Zły kod/data, powtórzona data, nieznany parametr query, niepoprawny backup lub inne źródło |
| 401 | Błędny Bearer kopii lub hasło ustawień |
| 429 | Czasowa blokada prób hasła, nagłówek Retry-After |
| 404 | Zasób cache nie istnieje lub upstream nie zna sali |
| 413 | Import powyżej 8 MiB, także kontrola strumienia; Nginx może zwrócić własną odpowiedź |
| 415 | Import lub sprawdzenie hasła bez application/json |
| 503 | Brak dostępnego planu albo wymagany token/hasło nie jest skonfigurowane |
| 500 | Nieobsłużony błąd lokalnego odczytu/zapisu, np. import z błędem dysku |

Cache wymaga dokładnego prefiksu `Bearer ` i nie obsługuje `x-admin-token`. Nie przycina tokenu po stronie serwera tak jak główny backend; klient UI przycina wpisaną wartość. Request timeout serwera to 15 s; timeout klienta i proxy także może zakończyć żądanie. Zwiększenie CACHE_TIMEOUT_SECONDS do 30 nie wydłuża automatycznie klienta/proxy, więc w takim ustawieniu mogą przerwać oczekiwanie wcześniej.

## Migracja ze starego wolumenu cache

Stara konfiguracja miała nazwany `schedule-cache`. Nowe Compose samo nie przenosi jego zawartości. Przed odtworzeniem starego kontenera, w katalogu dotychczasowego Compose:

```bash
docker compose stop cache
docker compose cp cache:/data/. ./frontend/cache-data/
```

To ścieżka ze wspólnego katalogu projektu; z samodzielnego `frontend/` cel to `./cache-data/`. Polecenie działa również ze zatrzymanym kontenerem, jeśli nadal istnieje. Po aktualizacji konfiguracji uruchom `docker compose up -d --build cache frontend`. Zachowaj stary wolumen do potwierdzenia danych. Nie kasuj źródła przed sprawdzeniem nowego JSON i odczytu planu bez upstream.
