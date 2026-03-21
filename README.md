# Room Tablet Preview

Demonstracyjny prototyp aplikacji webowej do wyświetlania informacji o zajęciach na tabletach montowanych przy salach.

## Cel tej wersji

To jest **preview produktu**:
- frontend pokazuje harmonogram sali na danych mockowych,
- backend działa jako szkielet pod przyszłe API,
- PostgreSQL jest gotowy jako osobny kontener pod dalszy rozwój,
- brak logowania, panelu admina i produkcyjnej logiki biznesowej.

## Stos i architektura

Projekt działa na Docker Compose i uruchamia 3 serwisy:
1. `frontend` (React + Vite + Tailwind CSS)
2. `backend` (Node.js + Express)
3. `database` (PostgreSQL 16)

## Widok aplikacji (frontend)

Interfejs jest zaprojektowany pod tablet w orientacji poziomej i wykorzystuje ciemnoniebieski motyw:
- **lewa sekcja (~80%)**: aktualnie trwające zajęcia,
- **prawa sekcja (~20%)**: pionowa lista harmonogramu „co dalej”,
- kliknięcie elementu listy otwiera **jeden reużywalny modal** ze szczegółami.

Dane pochodzą wyłącznie z mocków (`frontend/src/data/mockSchedule.ts`).

## Struktura projektu

```text
.
├── backend
│   ├── Dockerfile
│   ├── package.json
│   └── src
│       ├── index.js
│       └── mockSchedule.js
├── database
│   └── README.md
├── frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── src
│   │   ├── components
│   │   ├── data
│   │   ├── types
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── postcss.config.cjs
│   ├── tailwind.config.cjs
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

## Uruchomienie

Wymagania:
- Docker
- Docker Compose

Start całego środowiska:

```bash
docker compose up --build -d
```

Podgląd usług:

```bash
docker compose ps
```

Zatrzymanie:

```bash
docker compose down
```

Zatrzymanie z usunięciem wolumenu bazy:

```bash
docker compose down -v
```

## Porty i endpointy

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- PostgreSQL: `localhost:5432`

Endpointy backendu:
- `GET /health`
- `GET /api/schedule/mock`

Przykład:

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/schedule/mock
```

## Zakres backendu na teraz

Backend jest celowo minimalny:
- healthcheck,
- jeden endpoint z danymi mockowymi,
- brak połączenia z DB w logice runtime.

## Rola PostgreSQL na tym etapie

Baza działa jako osobny kontener i przygotowuje projekt pod kolejne etapy:
- tabele i migracje,
- podłączenie ORM,
- realne zapytania harmonogramu.

## Kierunki rozwoju (następny etap)

- podmiana mocków frontendu na dane z API,
- filtrowanie po sali/budynku/dniu,
- automatyczne oznaczanie „trwa teraz” na podstawie czasu,
- podłączenie backendu do PostgreSQL i dodanie modeli/migracji,
- rozszerzenie endpointów harmonogramu.
