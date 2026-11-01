# Testy i weryfikacja dokumentacji

[Przewodnik projektu](../README.md) · [Backend](../backend/README.md) · [Frontend](../frontend/README.md) · [Spis plików](PLIKI.md)

Dokumentacja opisuje aktualny kod, a nie docelowe funkcje planowane na przyszłość. Poniżej rozdzielono testy automatyczne, sprawdzenie instrukcji i ograniczenia weryfikacji. Polecenia zapisane jako Bash można wykonać na Linuksie/WSL; różnice natywnego PowerShell opisują przewodniki wdrożenia.

## Testy modelu i lokalnego cache

W `frontend/`, z Node.js 22:

```bash
npm run test:cache
```

Nie jest wymagane `npm ci` ani PostgreSQL: testy używają standardowych modułów Node i własnego upstream HTTP. Zwykły użytkownik systemu wykonuje 17 testów, a 2 testy zmiany UID są pomijane, jeśli proces nie ma UID 0. W kontenerze Linux można wykonać wszystkie 19 bez uruchamiania testów jako root na hoście:

```bash
docker run --rm --mount type=bind,source="$PWD",target=/app,readonly --workdir /app node:22-alpine npm run test:cache
```

Folder projektu jest tylko do odczytu, dane testowe powstają w tymczasowym katalogu kontenera. Na Windowsie wymagany jest Docker Desktop z kontenerami Linux i prawidłowo przekazaną ścieżką katalogu. Nie przedstawia to testu natywnego systemu plików Windows.

| Źródło | Liczba | Sprawdzane zachowania |
| --- | --- | --- |
| `shared/roomSchedule.test.mjs` | 3 | Granice początku/końca zajęć, zmiana dnia/północ Warszawy, odrzucanie błędnych sal/dat/czasów/duplikatów |
| `cache/test/cache.test.mjs` — podstawowe scenariusze | 11 | Zapis JSON i świeży odczyt, restart z wyłączonym upstream, błędny JSON/inne dane, 403/404, wcześniejszy dzień i jawna data, autoryzacja/walidacja importu, izolacja źródeł, równoległe odczyty/zapisy, odświeżanie w tle i powrót po awarii, timeout/brak kopii, błędne query |
| Ten sam plik — hasło ustawień API | 3 | Poprawne/błędne hasło bez upstream, osobne hasło i token kopii, fallback i brak konfiguracji, format i rozmiar żądania, ograniczenie błędnych prób |
| Ten sam plik — entrypoint | 2 | Folder należący do UID 0 i 12345, zachowanie snapshotu, obniżenie uprawnień, zapis jako właściciel |

Testy używają kontrolowanego zegara tam, gdzie to potrzebne. Nie sprawdzają każdej możliwej awarii sprzętu lub systemu plików i nie dowodzą odporności na wiele równoległych procesów zapisujących ten sam plik.

## Integracja backendu z PostgreSQL

Źródło: [roomApi.integration.test.ts](../backend/test/roomApi.integration.test.ts). Test wymaga osobnej bazy, której nazwa kończy się na `_test`, oraz konta z prawami do migracji i danych testowych. Nie uruchamiaj go z adresem bazy aplikacji. Nazwa `_test` jest sprawdzana przed migracjami i utworzeniem fixture.

W `backend/`, Bash, przy osiągalnej osobnej bazie:

```bash
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:55432/tablet_room_api_test npm run test:integration
```

PowerShell:

```powershell
$env:TEST_DATABASE_URL='postgresql://test_user:test_password@localhost:55432/tablet_room_api_test'
npm run test:integration
```

Przed pierwszym `npm ci` musi być ustawione również DATABASE_URL dla generacji Prisma; szczegóły w [backend/README.md](../backend/README.md#rozwój-bez-dockera).

Alternatywa bez Node na hoście: z katalogu Compose backendu utwórz osobną bazę testową i uruchom test w jednorazowym kontenerze. Poniżej przykładowe konto demonstracyjne z dostarczonego Compose; własne wdrożenie może mieć inne dane:

```bash
docker compose up -d --wait database
docker compose exec -T database createdb -U admin tablet_room_api_test
docker compose build backend
docker compose run --rm --no-deps -e TEST_DATABASE_URL=postgresql://admin:admin_password@database:5432/tablet_room_api_test backend npm run test:integration
```

`createdb` wymaga nieistniejącej jeszcze nazwy; dla istniejącego środowiska wybierz własną dedykowaną nazwę z końcówką `_test`. Test wykonuje build, migracje, tworzy własne rekordy, uruchamia rzeczywisty proces HTTP na wolnym porcie i usuwa fixture po zakończeniu. Baza oraz zastosowane migracje pozostają. Test nie wykonuje seeda i nie kasuje wszystkich danych bazy.

Sześć przypadków: plan właściwej sali/dnia i kolejność godzin; przeszła data; przyszła data; pusta istniejąca sala; nieznana sala 404; błędne, nieistniejące, puste i powtórzone daty 400. Nie jest to pełne pokrycie CRUD administratora ani test przeciążenia.

## Build i konfiguracja

Z katalogu `frontend/` po instalacji obu pakietów:

```bash
npm run build
npm run build --prefix admin
```

Z `backend/`: `npm run build`. Każdy build TypeScript sprawdza swój zakres źródeł; frontend nie wykonuje w ten sposób pełnego typechecku plików cache `.mjs`.

Walidacja Compose bez uruchamiania usług:

```bash
docker compose -f docker-compose.yml --env-file .env.example config --quiet
docker compose -f backend/docker-compose.yml --env-file backend/.env.example config --quiet
docker compose -f frontend/docker-compose.yml --env-file frontend/.env.example config --quiet
```

Te polecenia wykonuj z głównego katalogu repozytorium. Jawne `-f` pomija lokalny automatyczny override. Przykładowe wartości służą tylko sprawdzeniu konfiguracji; nie uruchamiają produkcyjnej instalacji. Nie publikuj pełnego wyniku `docker compose config` z prawdziwym `.env`, ponieważ zawiera rozwinięte sekrety.

`docker compose up -d --build --wait` sprawdza start i healthchecki usług, ale nie dowodzi poprawności danych biznesowych. Dlatego po instalacji sprawdź także znaną salę, datę, panel i kopię.

## Kontrola działającej instalacji

| Kontrola | Oczekiwane zachowanie |
| --- | --- |
| `GET /healthz` przez frontend | Nginx 200, niezależnie od API |
| `GET /api/health` | API i `SELECT 1` poprawne; pole database=ok |
| `GET /api/rooms`, plan znanej sali/daty | Dane tej sali, odpowiedni dzień i kolejność |
| Nieznana sala / nierealna data | 404 / 400 w JSON aplikacji |
| Wejście bezpośrednio na trasę panelu | Właściwy index.html aplikacji admin, potem kontrola sesji |
| API w widoku sali | Edytor i kopie ukryte do wpisania poprawnego hasła |
| Błędne hasło / poprawne hasło | Komunikat bez edycji / odsłonięty formularz |
| Zamknięcie i otwarcie okna | Ponowna prośba o hasło |
| Zapis endpointu, ponowne otwarcie | Ustawienie trwałe w tej przeglądarce, hasło nieutrwalane przez aplikację |
| Eksport i import JSON | Wymagają tokenu kopii i zgodnego source |
| Zatrzymanie głównego API po pobraniu planu | Zapisany plan z metadanymi stale; panel nie zapisuje |
| Restart cache przy wyłączonym API | Plan z zachowanego pliku; źródło i folder muszą być te same |
| Powrót API | Kolejne odświeżenie pobiera świeży plan i usuwa flagę imported/stale, jeśli odpowiedź jest poprawna |

Testowanie awarii przez `docker compose stop backend` zmienia dostępność rzeczywistej instalacji. Rób to w uzgodnionym środowisku testowym, po potwierdzeniu zapisu planu, i uruchom API ponownie po sprawdzeniu. W testach automatycznych awarie są symulowane w osobnych serwerach, bez zatrzymywania aplikacji użytkownika.

## Kontrola dokumentacji i wynik weryfikacji

Zakres przeglądu obejmuje każdy plik śledzony w repozytorium oraz nowe źródła i dokumenty, wszystkie nazwane funkcje/metody, konfigurację trzech pakietów, routery, DTO i modele bazy. Spis plików jest w [PLIKI.md](PLIKI.md); katalogi zależności, wyniki buildów i faktyczne dane są opisane oddzielnie jako pliki tworzone podczas pracy.

Sprawdzane elementy dokumentacji:

- zgodność nazw plików i symboli z aktualnym kodem, również prywatnych pomocników;
- zgodność tras, metod, filtrów, statusów, autoryzacji i kształtów odpowiedzi z routerami/kontrolerami;
- przykłady JSON przez parser i współdzielony model, tam gdzie przykład przedstawia cały plan/backup;
- istnienie lokalnych celów linków i nagłówków, domknięcie bloków kodu, spójność tabel;
- wyświetlanie dokumentów, tabel i dwóch diagramów Mermaid;
- zastosowanie migracji na pustej bazie i fizyczne typy kolumn, seed oraz kopia/odtworzenie na danych tymczasowych;
- polecenia i zakresy konfiguracji względem manifestów, Dockerfile, Compose i faktycznego działania.

### Wynik audytu — 2026-11-01

| Wymagany zakres | Sprawdzenie i wynik |
| --- | --- |
| Osobna dokumentacja backendu i frontendu, przewodnik całości | 11 dokumentów: README główne, przewodniki pakietów, API, baza, referencje kodu, użytkowanie, cache, indeks i ten raport |
| Wszystkie pliki | 150 pozycji indeksu porównanych z plikami wersjonowanymi i nowymi; brak pominiętych pozycji. Dane generowane i sekrety opisane oddzielnie |
| Funkcje i metody | Inwentaryzacja AST TypeScript: 149 nazwanych deklaracji backendu i 200 frontendu, w tym pomocniki testowe i deklaracje typów modelu. Wszystkie nazwy występują w dokumentacji odpowiedniej części; opisy zestawiono z kodem |
| Publiczne API i administracja | Przegląd routerów, kontrolerów i DTO oraz 53 udane wywołania kontrolne na odizolowanej instalacji, także CRUD słowników/sal/zajęć, zależności, konflikt i kaskadowe usunięcie |
| Model i cache | 19 testów zakończonych powodzeniem w kontenerze Linux, bez pominięć; obejmują też hasło i UID folderów |
| Backend z prawdziwą bazą | 6 testów integracyjnych zakończonych powodzeniem; build TypeScript i migracje na dedykowanej bazie `_test` |
| Instalacja i konfiguracja | Wszystkie trzy Compose przechodzą config --quiet z własnymi przykładami środowiska; skrypty npm i klucze środowiska mają opisy. Build interfejsów i cache wykonano po dodaniu hasła; backend zbudowano także podczas tego audytu |
| Pierwsze dane i role | W odizolowanej bazie wykonano init roli, migracje i seed: 5 sal, 25 zajęć. Konto web_app odczytuje sale, a INSERT jest odrzucany z SQLSTATE 42501 |
| Kopia i odtworzenie PostgreSQL | pg_dump -Fc, kopiowanie kontener → host → kontener i pg_restore --clean --if-exists --exit-on-error. Porównanie uporządkowanej zawartości 10 tabel, łącznie z historią migracji: wszystkie skróty zgodne; odtworzono 5 sal i 25 zajęć |
| Przykłady danych | Wszystkie 5 bloków JSON jest poprawnych składniowo; pełny plan i backup przeszły walidację rzeczywistym modelem, formularze wykorzystano w wywołaniach API po podstawieniu ID testowych |
| Odnośniki i formatowanie | 395 lokalnych linków wraz z odwołaniami do nagłówków poprawnych; bloki kodu i kolumny tabel spójne; git diff --check bez błędów |
| Wyświetlanie | Wszystkie 11 dokumentów wyrenderowano w pamięci Obsidiana i porównano liczby nagłówków/tabel ze źródłem. Dwa diagramy Mermaid osobno przeszły parser i wygenerowały SVG. Tymczasowe notatki usunięto |
| Obsługa przycisku API | Doraźny test Firefoksa po wdrożeniu hasła: brak edytora przed logowaniem, błędne/poprawne hasło, zapis endpointu, ponowne zablokowanie i przywrócenie domyślnego, brak utrwalenia sekretu przez aplikację |

Weryfikacja funkcjonalna używała tymczasowego projektu Docker i danych demonstracyjnych. Główna baza nie była resetowana, odtwarzana ani seedowana. Zestaw testów i doraźne kontrole mają zakres opisany powyżej; nie są deklaracją pełnego pokrycia wszystkich gałęzi kodu. Testowe kontenery, baza, dump i skrypty kontrolne są usuwane po sprawdzeniu; przydatny wynik pozostaje w tym raporcie.

## Ograniczenia i istniejące różnice w projekcie

- Weryfikacja odbywa się na Linuksie; instrukcje Windows/PowerShell opierają się na składni i konfiguracji, nie na teście rzeczywistego Windowsa.
- Są testy integracyjne planu sali i cache; repo nie ma stałego zestawu E2E UI ani pełnego pokrycia administracji. Doraźne sprawdzenie UI nie zastępuje takiego zestawu.
- Cache nie synchronizuje zapisów do głównej bazy, nie jest blokowany między procesami i nie zastępuje kopii PostgreSQL.
- Schemat Prisma i migracje różnią się typami dwóch kolumn; szczegóły w [modelu bazy](../backend/database/README.md#model-i-relacje). CHECK kolejności czasu istnieje w SQL migracji, choć nie jest wyrażony w modelu Prisma.
- UI sali formatuje zegar w Europe/Warsaw, panel w strefie przeglądarki; APP_TIMEZONE nie zmienia wszystkich etykiet interfejsu.
- Hasło chroni wejście do interfejsu ustawień; lokalne ustawienie endpointu w localStorage nie jest zabezpieczeniem przed użytkownikiem z dostępem do profilu przeglądarki.
- Repo nie konfiguruje TLS ani kompleksowej kontroli dostępu sieciowego; publiczne odczyty planów są dostępne bez tokenu.
- Dokumentacja nie ustanawia gwarancji wydajności, odporności na każdą utratę zasilania ani zgodności ze wszystkimi wersjami Docker Desktop.
