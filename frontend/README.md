# Frontend

Ten katalog jest samodzielnym pakietem wdrożeniowym. Nie potrzebuje plików
z `backend/`. Zawiera widok sal (`src/`) i panel administratora (`admin/`).
Jeden obraz Dockera buduje oba interfejsy i uruchamia je na Nginx.

## Uruchomienie na serwerze frontendu

Wymagane: Docker z Buildx/BuildKit i Docker Compose.

```bash
cp .env.example .env
```

W `.env` ustaw `BACKEND_URL` na adres API osiągalny z tego serwera, np.
`http://192.168.1.20:3001` (bez `/api` i końcowego `/`). Następnie:

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
- `/api/*` — żądania przekazywane do serwera backendu;
- `/healthz` — stan serwera frontendu, niezależny od dostępności API.

Port ustawia `FRONTEND_PORT` (domyślnie `5173`). `TABLET_ROOM_ID` jest argumentem
budowania; po jego zmianie przebuduj obraz. Zmiana `BACKEND_URL` wymaga tylko
odtworzenia kontenera (`docker compose up -d --force-recreate frontend`).
Token administratora i dane dostępowe do bazy są konfigurowane w backendzie.

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

Przycisk **Przywróć domyślne** wraca do `/api/room/{roomId}` i serwera wskazanego
przez `BACKEND_URL`. Ustawienia są dostępne również podczas
ładowania i po błędzie połączenia, aby można było poprawić niedziałający adres.

Własny adres innego serwera jest wywoływany bezpośrednio z przeglądarki.
Backend musi dopuszczać adres frontendu w `CORS_ORIGIN`. Przy stronie działającej
przez HTTPS własny endpoint również musi używać HTTPS. Domyślna ścieżka `/api`
nadal korzysta z proxy serwera frontendu.

Konfiguracja Nginx: `nginx/default.conf.template`. Przy starcie kontenera
oficjalny entrypoint Nginx podstawia `BACKEND_URL` do tej konfiguracji. Adres
jest sprawdzany przed uruchomieniem serwera: dozwolone są `http://` i `https://`,
nazwa lub IP serwera oraz opcjonalny port. Wartość nie może zawierać ścieżki.
Zmiana `BACKEND_URL` nie zmienia zbudowanych plików JavaScript. Widok sal
i panel administratora domyślnie wysyłają żądania do względnego `/api`.

## Pobieranie i wyświetlanie danych sali

Otwarcie `/room/205` powoduje wysłanie `GET /api/room/205` z nagłówkiem
`Accept: application/json`. Nginx przekazuje żądanie do `BACKEND_URL`, np.
`http://192.168.1.20:3001/api/room/205`. W trybie deweloperskim robi to proxy Vite.

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

Wymagany Node.js 22. Widok sal:

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

Docker kopiuje wyniki obu kompilacji do jednego katalogu serwera WWW,
z panelem w podkatalogu `/admin/` i obsługą bezpośrednich wejść na jego trasy.
