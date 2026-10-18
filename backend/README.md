# Backend

Ten katalog jest samodzielnym pakietem wdrożeniowym. Nie potrzebuje plików
z `frontend/`. Zawiera API Express / TypeScript, Prisma i konfigurację PostgreSQL.

## Uruchomienie na serwerze backendu

Wymagane: Docker z Buildx/BuildKit i Docker Compose.

```bash
cp .env.example .env
```

Ustaw w `.env` własny `ADMIN_TOKEN`, adres frontendu w `CORS_ORIGIN`
(np. `http://192.168.1.10:5173`) i opcjonalnie `BACKEND_PORT` oraz `APP_TIMEZONE`.

```bash
docker compose up -d --build --wait
```

Katalog działa samodzielnie po skopiowaniu na serwer. Compose buduje API
z bieżącego katalogu, uruchamia PostgreSQL i montuje skrypty inicjalizacyjne
z `database/init/`. Docker instaluje zależności przez `npm ci` i generuje klienta
Prisma z dołączonego schematu. `node_modules`, `dist`, `.env` i `.git` z hosta
są wykluczone z obrazu.

API jest dostępne na porcie `3001` (lub `BACKEND_PORT`), pod `/api`.
Przykładowe sprawdzenie: `http://ADRES_BACKENDU:3001/api/health`.
Frontend łączy się z tym serwerem przez własne ustawienie `BACKEND_URL`.

## Dane sali w JSON

Publiczny endpoint `GET /api/room/:id` odczytuje salę i jej zajęcia z PostgreSQL.
`:id` oznacza numer/kod sali, np. `205`, zgodnie z polem `roomCode` w bazie;
nie jest to wewnętrzny identyfikator rekordu bazy.

```text
GET /api/room/205                  — dzisiejszy plan w APP_TIMEZONE
GET /api/room/205?date=2026-10-18  — plan wybranego dnia
```

Przykładowa odpowiedź (wartości pochodzą z rekordów danej sali):

```json
{
  "room": {
    "roomId": "205",
    "name": "Sala komputerowa 205",
    "building": "Budynek A",
    "floor": "II piętro"
  },
  "date": "2026-10-18",
  "generatedAt": "2026-10-18T12:00:00.000Z",
  "currentLecture": null,
  "nextLecture": null,
  "schedule": [
    {
      "id": "lec-42",
      "title": "Bazy danych",
      "room": "205",
      "date": "2026-10-18",
      "subject": "Bazy danych",
      "subjectCode": "INF-BD",
      "lecturer": "Jan Kowalski",
      "group": "INF-2A",
      "type": "Laboratorium",
      "startTime": "08:00",
      "endTime": "09:30",
      "description": "Zapytania SQL",
      "fieldOfStudy": "Informatyka",
      "status": "finished",
      "isCurrent": false
    }
  ]
}
```

Lista `schedule` zawiera wyłącznie wpisy tej sali z wybranego dnia, posortowane
według godziny rozpoczęcia. `currentLecture` wskazuje trwające zajęcia,
a `nextLecture` najbliższe nadchodzące; przy braku odpowiednich zajęć mają
wartość `null`. Zajęcia z przeszłych dni są zakończone, a z przyszłych — nadchodzące.

Istniejąca sala bez zajęć zwraca `200` i `schedule: []`. Nieistniejąca sala
zwraca `404` z kodem `ROOM_NOT_FOUND`. Nieprawidłowa data zwraca `400`
z kodem `INVALID_DATE`. Odpowiedzi mają format JSON i nagłówek
`Cache-Control: no-store`, aby kolejne odczyty pobierały aktualny stan planu.

PostgreSQL jest dostępny tylko dla backendu w prywatnej sieci Dockera.
Dane są przechowywane w wolumenie `tablet_app_backend_postgres-data`.
Konta bazy i ich dotychczasowe hasła pozostają takie jak przed podziałem projektu.

## Zachowanie istniejących danych

Domyślny wolumen tego pakietu to `tablet_app_backend_postgres-data`. Główny
Compose zachowuje dotychczasowy `tablet_app_web_postgres-data`.
Jeśli przenosisz uruchomienie ze wspólnego Compose na sam backend **na tym samym
serwerze**, zatrzymaj poprzednie API i PostgreSQL, a w `.env` backendu ustaw:

```dotenv
POSTGRES_VOLUME=tablet_app_web_postgres-data
POSTGRES_VOLUME_EXTERNAL=true
```

Następnie uruchom `docker compose up -d --build --wait` z katalogu backendu.
PostgreSQL użyje istniejącego wolumenu, a migracje Prisma nie odtworzą danych.
`POSTGRES_VOLUME_EXTERNAL=true` wymaga istnienia wskazanego wolumenu; błędna
nazwa zatrzyma wdrożenie zamiast utworzyć pustą bazę. Nie uruchamiaj równocześnie
dwóch instancji PostgreSQL na tym samym wolumenie.

Jeżeli korzystasz z własnej nazwy projektu Compose, sprawdź rzeczywistą nazwę
wolumenu przez `docker volume ls` i wpisz ją jako `POSTGRES_VOLUME`.
Przy zmianie serwera przenieś dane przez kopię `pg_dump` / `pg_restore`;
szczegółowe polecenia znajdują się w głównym README.

`docker compose down` zachowuje dane. Nie używaj `down -v` do zwykłego
zatrzymania aplikacji. Seed jest opcjonalny i nie wykonuje się automatycznie.

Migracje Prisma wykonują się automatycznie podczas startu backendu. Opcjonalny
seed dla nowej bazy:

```bash
docker compose exec -T backend npm run db:seed
```

Seed usuwa istniejące dane i tworzy zestaw demonstracyjny. Instrukcja przeniesienia
istniejącej bazy znajduje się w głównym README projektu.

Logi i zatrzymanie:

```bash
docker compose logs -f backend
docker compose down
```

## Praca nad kodem bez Dockera

Wymagany Node.js 22 i istniejąca baza PostgreSQL z wykonanymi migracjami.
Ustaw zmienne `DATABASE_URL` (konto odczytu), `DATABASE_ADMIN_URL` (konto zapisu),
`ADMIN_TOKEN`, `APP_TIMEZONE` i `CORS_ORIGIN` w środowisku procesu. Domyślny port
to `3001`, można go zmienić zmienną `PORT`.

```bash
npm ci
npm run db:migrate
npm run dev
```

Kompilacja: `npm run build`. Start skompilowanego API: `npm start`.
Szczegóły bazy: [database/README.md](database/README.md).

## Test integracyjny endpointu

Test uruchamia rzeczywisty backend HTTP i sprawdza odpowiedzi z PostgreSQL.
Wymaga osobnej bazy z nazwą kończącą się na `_test` i konta z uprawnieniami
do migracji oraz tworzenia danych testowych:

```bash
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:55432/tablet_room_api_test npm run test:integration
```

Test wykonuje migracje na tej bazie, dodaje własne rekordy i usuwa je po zakończeniu.
Sprawdza filtr sali i dnia, kolejność zajęć, dane przedmiotu, puste harmonogramy,
brak sali oraz błędne daty. Nie uruchamia seeda demonstracyjnego.
